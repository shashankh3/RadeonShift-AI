import httpx
import json
import os
import subprocess
from core.config import FIREWORKS_API_KEY

USE_MOCK_AI = os.environ.get("USE_MOCK_AI", "false").lower() == "true"


def get_mock_audit_findings():
    """Return predefined audit findings for demo mode (USE_MOCK_AI=true)."""
    return [
        {
            "severity": "HIGH",
            "category": "Wavefront Correctness",
            "line": 14,
            "context": "int lane = tid % 32;",
            "finding": "Hardcoded warpSize=32 assumption. AMD wavefront is 64 on gfx942. This will silently produce wrong results on MI300X.",
            "fix": "Replace literal 32 with warpSize query",
            "auto_fixable": True,
            "patch": "int lane = tid % warpSize;"
        },
        {
            "severity": "MEDIUM",
            "category": "Memory Coalescing",
            "line": 22,
            "context": "for (int offset = 16; offset > 0; offset >>= 1)",
            "finding": "Reduction offset hardcoded to 16. On wavefront-64, initial offset should be 32 for optimal reduction.",
            "fix": "Use warpSize / 2 as initial offset",
            "auto_fixable": True,
            "patch": "for (int offset = warpSize / 2; offset > 0; offset >>= 1)"
        }
    ]


def get_hardware_context():
    """Fetch live AMD hardware context for injection into MoA prompts."""
    try:
        result = subprocess.run(
            ["rocm-smi", "--showproductname", "--showmeminfo", "vram", "--showuse", "gpu"],
            capture_output=True, text=True, timeout=5
        )
        return result.stdout if result.returncode == 0 else "Hardware unavailable — fallback mode"
    except Exception:
        return "Hardware unavailable — fallback mode"


async def call_agent_a(cuda_code: str, hipify_output: str = "", scanner_findings: str = "") -> dict:
    if USE_MOCK_AI:
        findings = get_mock_audit_findings()
        return {"ptx_risks": findings, "manual_intervention_required": any(
            f.get("severity") in ["CRITICAL", "HIGH"] for f in findings
        )}
    if FIREWORKS_API_KEY == "dummy_key_for_testing":
        return {
            "ptx_risks": [
                "Line 14: Found hardcoded __asm__ block. Manual CDNA 3 rewrite required.",
                "Line 42: warpSize == 32 constraint detected."
            ],
            "manual_intervention_required": True
        }
    if not FIREWORKS_API_KEY:
        return {"ptx_risks": [], "manual_intervention_required": False}

    hw_context = get_hardware_context()

    system_prompt = f"""You are the NVIDIA Purist agent. Your job is to scan CUDA source code for NVIDIA-specific lock-in mechanics that will cause silent correctness bugs on AMD hardware.

TARGET HARDWARE CONTEXT:
{hw_context}

Look specifically for:
1. Hardcoded warpSize == 32 assumptions (AMD wavefront is 64 on gfx942)
2. Inline PTX assembly (__asm__ blocks)
3. __shfl_sync with NVIDIA-specific masks (0xFFFFFFFF assumes 32 lanes)
4. Cooperative groups tiling that assumes 32-lane warps
5. Duplicate main() blocks or leftover boilerplate

Return findings as a JSON array. Each finding must have these exact fields:
- severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
- category: "Wavefront Correctness" | "Memory Coalescing" | "API Compatibility" | "Performance" | "Boilerplate"
- line: <integer line number>
- context: <exact code snippet from that line>
- finding: <clear description of why this is risky on AMD>
- fix: <recommended fix with code>
- auto_fixable: <true or false>
- patch: <the corrected code line(s) as a string, or null if not auto-fixable>

If the code is perfectly clean with no issues, return exactly:
[{{"severity": "LOW", "category": "Verification", "line": 0, "context": "N/A", "finding": "No NVIDIA-specific lock-in detected. Code is AMD-portable.", "fix": "No fix needed.", "auto_fixable": false, "patch": null}}]

Always return a valid JSON array, not an object."""

    user_message = f"""[DETERMINISTIC CONTEXT — High Confidence]
hipify-perl output:
{hipify_output if hipify_output else "(not provided)"}

Scanner findings:
{scanner_findings if scanner_findings else "(not provided)"}

[CUDA SOURCE]
{cuda_code}

[INSTRUCTIONS]
Scan the CUDA source above for NVIDIA-specific lock-in. Return a JSON array of findings per the schema in your system prompt."""

    payload = {
        "model": "accounts/fireworks/models/deepseek-v4-flash",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.1,
        "max_tokens": 2048,
        "response_format": {"type": "json_object"}
    }
    headers = {
        "Authorization": f"Bearer {FIREWORKS_API_KEY}",
        "Content-Type": "application/json"
    }
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post("https://api.fireworks.ai/inference/v1/chat/completions", headers=headers, json=payload, timeout=30.0)
            if res.status_code == 200:
                raw = json.loads(res.json()["choices"][0]["message"]["content"])
                # The model may return {"findings": [...]} or a bare array
                if isinstance(raw, list):
                    findings = raw
                elif isinstance(raw, dict):
                    # Try to pull ptx_risks for backward-compat, or findings for new schema
                    if "ptx_risks" in raw:
                        return raw
                    findings = raw.get("findings", [])
                else:
                    findings = []
                return {"ptx_risks": findings, "manual_intervention_required": any(
                    f.get("severity") in ["CRITICAL", "HIGH"] for f in findings if isinstance(f, dict)
                )}
        except Exception:
            pass
        return {"ptx_risks": [], "manual_intervention_required": False}


async def call_agent_b(cuda_code: str, hip_code: str, hipify_output: str = "", scanner_findings: str = "") -> dict:
    if USE_MOCK_AI:
        return {"wavefront_optimizations": [], "estimated_mi300x_ms": 0.0}
    if FIREWORKS_API_KEY == "dummy_key_for_testing":
        return {
            "wavefront_optimizations": [
                "Migrate block dimensions to accommodate 64-lane wavefronts (Wave64).",
                "Replace generic shared memory barriers with targeted MI300X intrinsics."
            ],
            "estimated_mi300x_ms": 12.5
        }
    if not FIREWORKS_API_KEY:
        return {"wavefront_optimizations": [], "estimated_mi300x_ms": 0.0}

    hw_context = get_hardware_context()

    system_prompt = f"""You are the AMD Optimizer agent. Your job is to analyze both the original CUDA code and the translated HIP code, and suggest MI300X-specific optimizations.

TARGET HARDWARE CONTEXT:
{hw_context}

Focus on:
1. Memory coalescing opportunities for MI300X HBM3 architecture
2. Grid/block dimension adjustments for wavefront-64
3. Shared memory bank conflicts
4. Occupancy optimization for MI300X compute units
5. Any translation artifacts from hipify-perl that need manual correction

Return findings in the same JSON schema as Agent A (severity, category, line, context, finding, fix, auto_fixable, patch).
Always return a valid JSON array, not an object."""

    user_message = f"""[DETERMINISTIC CONTEXT — High Confidence]
hipify-perl output:
{hipify_output if hipify_output else "(not provided)"}

Scanner findings:
{scanner_findings if scanner_findings else "(not provided)"}

[CUDA SOURCE]
{cuda_code}

[HIP OUTPUT]
{hip_code}

[INSTRUCTIONS]
Suggest MI300X-specific optimizations. Return a JSON array of findings per the schema in your system prompt."""

    payload = {
        "model": "accounts/fireworks/models/deepseek-v4-flash",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.1,
        "max_tokens": 2048,
        "response_format": {"type": "json_object"}
    }
    headers = {
        "Authorization": f"Bearer {FIREWORKS_API_KEY}",
        "Content-Type": "application/json"
    }
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post("https://api.fireworks.ai/inference/v1/chat/completions", headers=headers, json=payload, timeout=30.0)
            if res.status_code == 200:
                raw = json.loads(res.json()["choices"][0]["message"]["content"])
                if isinstance(raw, list):
                    findings = raw
                elif isinstance(raw, dict):
                    if "wavefront_optimizations" in raw:
                        return raw
                    findings = raw.get("findings", [])
                else:
                    findings = []
                return {
                    "wavefront_optimizations": findings,
                    "estimated_mi300x_ms": 0.012
                }
        except Exception:
            pass
        return {"wavefront_optimizations": [], "estimated_mi300x_ms": 0.0}
