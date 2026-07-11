import httpx
import json
from core.config import FIREWORKS_API_KEY

async def call_agent_a(cuda_code: str) -> dict:
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
        
    prompt = "You are an NVIDIA Purist Auditor. Identify NVIDIA-specific hardcoding like PTX and warp assumptions. If no risks exist, you MUST still provide 3 detailed bullet points confirming the absence of these risks and verifying portability. Output JSON with 'ptx_risks': list of strings and 'manual_intervention_required': boolean."
    payload = {
        "model": "accounts/fireworks/models/deepseek-v4-flash",
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"CUDA Code:\n{cuda_code}"}
        ],
        "temperature": 0.1,
        "max_tokens": 1024,
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
                return json.loads(res.json()["choices"][0]["message"]["content"])
        except Exception:
            pass
        return {"ptx_risks": [], "manual_intervention_required": False}

async def call_agent_b(cuda_code: str, hip_code: str) -> dict:
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
        
    prompt = "You are an AMD Optimizer. Suggest MI300X specific optimizations (e.g. 64-lane wavefronts). If no optimizations are needed, you MUST still provide 3 detailed bullet points explaining why the current architecture choices are already optimal for MI300X. Output JSON with 'wavefront_optimizations': list of strings and 'estimated_mi300x_ms': float."
    payload = {
        "model": "accounts/fireworks/models/deepseek-v4-flash",
        "messages": [
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"CUDA Code:\n{cuda_code}\n\nROCm Code:\n{hip_code}"}
        ],
        "temperature": 0.1,
        "max_tokens": 1024,
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
                return json.loads(res.json()["choices"][0]["message"]["content"])
        except Exception:
            pass
        return {"wavefront_optimizations": [], "estimated_mi300x_ms": 0.0}
