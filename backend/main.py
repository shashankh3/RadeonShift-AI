from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import os
import uuid
import httpx
import asyncio
import psutil
import json
import re
import shutil
import tempfile
import time
import hashlib
from datetime import datetime, timezone

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

FIREWORKS_API_KEY = os.environ.get("FIREWORKS_API_KEY")
if not FIREWORKS_API_KEY:
    raise RuntimeError("FIREWORKS_API_KEY environment variable is not set. See .env.example")

class CodeRequest(BaseModel):
    cuda_code: str

def perform_static_portability_scan(hip_code: str, cuda_code: str) -> dict:
    findings = []
    
    # PTX inline assembly checks
    ptx_patterns = [r"asm\s*\(", r"asm\s*\{", r"__asm__"]
    ptx_count = 0
    for p in ptx_patterns:
        matches = re.findall(p, cuda_code)
        ptx_count += len(matches)
    if ptx_count > 0:
        findings.append({
            "severity": "critical",
            "category": "ptx",
            "message": f"Found {ptx_count} instance(s) of inline PTX assembly. This requires manual review and rewriting for AMD architecture.",
            "manual_review_required": True
        })

    # Warp assumptions
    warp_count = len(re.findall(r"warpSize", cuda_code))
    if warp_count > 0:
        findings.append({
            "severity": "warning",
            "category": "warp",
            "message": f"Found {warp_count} instance(s) of 'warpSize'. Ensure logic accommodates Wavefront64 instead of strictly Wavefront32.",
            "manual_review_required": False
        })
        
    # CUDA Library dependencies
    cuda_libs = ["cublas", "cusparse", "cufft", "curand", "cusolver"]
    found_libs = []
    for lib in cuda_libs:
        if lib in cuda_code.lower():
            found_libs.append(lib)
    if found_libs:
        findings.append({
            "severity": "critical",
            "category": "library",
            "message": f"Code relies on CUDA-specific libraries: {', '.join(found_libs)}. Ensure equivalent rocBLAS/rocFFT/etc. drop-ins are implemented.",
            "manual_review_required": True
        })
        
    # CUDA API remnants in the HIP output
    cuda_api = ["cudaMalloc", "cudaMemcpy", "cudaDeviceSynchronize"]
    api_remnants = []
    for api in cuda_api:
        if api in hip_code:
            api_remnants.append(api)
    if api_remnants:
        findings.append({
            "severity": "critical",
            "category": "api",
            "message": f"Found unresolved CUDA API calls in output: {', '.join(api_remnants)}. Translation may be incomplete.",
            "manual_review_required": True
        })
        
    # Check <<< >>> launch syntax in HIP code
    if re.search(r"<<<.*?>>>", hip_code):
        findings.append({
            "severity": "warning",
            "category": "api",
            "message": "Found <<< >>> launch syntax in output. While supported by HIP, consider using hipLaunchKernelGGL for standard compliance.",
            "manual_review_required": False
        })

    manual_review = any(f.get("manual_review_required", False) for f in findings)
    
    return {
        "ptx_blocks": ptx_count,
        "warp32_assumptions": warp_count,
        "cuda_library_dependencies": found_libs,
        "cuda_api_remnants": api_remnants,
        "findings": findings,
        "manual_review_required": manual_review
    }

def attempt_hip_compile(hip_code: str) -> dict:
    hipcc_path = shutil.which("hipcc")
    if not hipcc_path:
        return {
            "attempted": False,
            "status": "unavailable",
            "compiler": None,
            "duration_ms": 0,
            "return_code": 0,
            "stderr_summary": None,
            "reason": "hipcc is not installed or not available in PATH"
        }
    
    with tempfile.TemporaryDirectory() as tmpdir:
        file_path = os.path.join(tmpdir, "kernel.hip.cpp")
        with open(file_path, "w") as f:
            f.write(hip_code)
            
        start_time = time.time()
        try:
            # -c means compile to object file, don't link, which is safer for kernels
            process = subprocess.run([hipcc_path, "-c", file_path, "-o", os.path.join(tmpdir, "kernel.o")], 
                                     capture_output=True, text=True, timeout=20)
            elapsed_ms = int((time.time() - start_time) * 1000)
            
            # Sanitize stderr
            stderr = process.stderr.replace(tmpdir, "<tmp>")
            stderr_summary = stderr[:500] + ("..." if len(stderr) > 500 else "") if stderr else None
            
            return {
                "attempted": True,
                "status": "passed" if process.returncode == 0 else "failed",
                "compiler": "hipcc",
                "duration_ms": elapsed_ms,
                "return_code": process.returncode,
                "stderr_summary": stderr_summary,
                "reason": None
            }
        except subprocess.TimeoutExpired:
            elapsed_ms = int((time.time() - start_time) * 1000)
            return {
                "attempted": True,
                "status": "failed",
                "compiler": "hipcc",
                "duration_ms": elapsed_ms,
                "return_code": -1,
                "stderr_summary": "Compilation timed out after 20 seconds.",
                "reason": "timeout"
            }
        except Exception as e:
            elapsed_ms = int((time.time() - start_time) * 1000)
            return {
                "attempted": True,
                "status": "failed",
                "compiler": "hipcc",
                "duration_ms": elapsed_ms,
                "return_code": -1,
                "stderr_summary": str(e)[:500],
                "reason": "subprocess error"
            }

def build_verification_result(cuda_code: str, hip_code: str, telemetry: dict) -> dict:
    static_scan = perform_static_portability_scan(hip_code, cuda_code)
    compile_result = attempt_hip_compile(hip_code)
    
    ts = datetime.now(timezone.utc).isoformat()
    evidence_data = (hip_code + ts).encode('utf-8')
    evidence_id = "rs_" + hashlib.sha256(evidence_data).hexdigest()[:12]
    
    if compile_result["status"] == "passed":
        if any(f.get("severity") in ["warning", "critical"] for f in static_scan["findings"]):
            status = "verified_with_warnings"
        else:
            status = "compile_verified"
    elif compile_result["status"] == "failed":
        status = "compile_blocked"
    else:
        if static_scan["manual_review_required"]:
            status = "static_review_required"
        else:
            status = "verification_unavailable"
            
    return {
        "status": status,
        "evidence_id": evidence_id,
        "timestamp_utc": ts,
        "compile": compile_result,
        "static_analysis": static_scan,
        "execution": {
            "attempted": False,
            "status": "not_run",
            "reason": "RadeonShift does not execute uploaded kernels without an explicit safe test harness."
        },
        "environment": {
            "telemetry_source": telemetry.get("source", "unavailable"),
            "gpu": telemetry.get("hardware") if telemetry.get("source") == "live_rocm_smi" else None
        }
    }

@app.get("/health")
async def health():
    try:
        process = subprocess.run(["rocm-smi", "--showproductname", "--showmeminfo", "vram", "--showuse", "gpu"],
                              capture_output=True, text=True, timeout=5)
        if process.returncode == 0:
            return {
                "status": "operational",
                "hardware": process.stdout,
                "source": "live_rocm_smi"
            }
        else:
            raise Exception("rocm-smi failed")
    except Exception:
        return {
            "status": "degraded",
            "hardware": None,
            "source": "rocm_smi_unavailable"
        }

@app.get("/verification-capabilities")
async def verification_capabilities():
    has_hipcc = shutil.which("hipcc") is not None
    has_hipify = shutil.which("hipify-perl") is not None
    has_rocm_smi = shutil.which("rocm-smi") is not None
    
    return {
        "hipcc_available": has_hipcc,
        "hipify_available": has_hipify,
        "rocm_smi_available": has_rocm_smi,
        "execution_enabled": False,
        "reason": "Uploaded kernels are never executed automatically."
    }

@app.post("/translate")
async def translate_code(request: CodeRequest):
    if not FIREWORKS_API_KEY:
        raise HTTPException(status_code=500, detail="Server Configuration Error: API Key missing.")

    file_id = str(uuid.uuid4())
    input_file = f"{file_id}.cu"
    output_file = f"{file_id}_amd.cpp"
    
    try:
        with open(input_file, "w") as f:
            f.write(request.cuda_code)
            
        try:
            process = subprocess.run(
                ["hipify-perl", input_file, "-o", output_file],
                capture_output=True, text=True
            )
            if process.returncode != 0:
                raise HTTPException(status_code=500, detail="HIP translation failed.")
        except FileNotFoundError:
            with open(output_file, "w") as f_out:
                f_out.write(request.cuda_code.replace("cuda", "hip").replace("__global__", "__hip_global__"))
            
        with open(output_file, "r") as f:
            rocm_code = f.read()
            
        headers = {
            "Authorization": f"Bearer {FIREWORKS_API_KEY}",
            "Content-Type": "application/json"
        }
        
        async def call_agent_a(cuda_code: str) -> dict:
            prompt = "You are an NVIDIA Purist Auditor. Identify NVIDIA-specific hardcoding like PTX and warp assumptions. Output JSON with 'ptx_risks': list of strings and 'manual_intervention_required': boolean."
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
            async with httpx.AsyncClient() as client:
                res = await client.post("https://api.fireworks.ai/inference/v1/chat/completions", headers=headers, json=payload, timeout=30.0)
                if res.status_code == 200:
                    try:
                        return json.loads(res.json()["choices"][0]["message"]["content"])
                    except Exception:
                        return {"ptx_risks": [], "manual_intervention_required": False}
                return {"ptx_risks": [], "manual_intervention_required": False}

        async def call_agent_b(cuda_code: str, hip_code: str) -> dict:
            prompt = "You are an AMD Optimizer. Suggest MI300X specific optimizations (e.g. 64-lane wavefronts). Output JSON with 'wavefront_optimizations': list of strings and 'estimated_mi300x_ms': float."
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
            async with httpx.AsyncClient() as client:
                res = await client.post("https://api.fireworks.ai/inference/v1/chat/completions", headers=headers, json=payload, timeout=30.0)
                if res.status_code == 200:
                    try:
                        return json.loads(res.json()["choices"][0]["message"]["content"])
                    except Exception:
                        return {"wavefront_optimizations": [], "estimated_mi300x_ms": 0.0}
                return {"wavefront_optimizations": [], "estimated_mi300x_ms": 0.0}

        audit, optimization = await asyncio.gather(
            call_agent_a(request.cuda_code),
            call_agent_b(request.cuda_code, rocm_code)
        )
        
        telemetry_res = await health()
        
        async def run_verification():
            return await asyncio.to_thread(build_verification_result, request.cuda_code, rocm_code, telemetry_res)
            
        verification = await run_verification()

        readiness_score = 100
        if audit.get("manual_intervention_required") or verification["static_analysis"]["manual_review_required"]:
            readiness_score -= 50
        if len(audit.get("ptx_risks", [])) > 0 or verification["static_analysis"]["ptx_blocks"] > 0:
            readiness_score -= 20
        readiness_score = max(0, readiness_score)

        final_audit_log = {
            "readiness_score": readiness_score,
            "ptx_risks": audit.get("ptx_risks", []),
            "wavefront_optimizations": optimization.get("wavefront_optimizations", []),
            "manual_intervention_required": audit.get("manual_intervention_required", False) or verification["static_analysis"]["manual_review_required"],
            "estimated_mi300x_ms": optimization.get("estimated_mi300x_ms", 0.0)
        }
        
        return {
            "rocm_code": rocm_code,
            "audit_log": json.dumps(final_audit_log),
            "verification": verification
        }
        
    finally:
        if os.path.exists(input_file): os.remove(input_file)
        if os.path.exists(output_file): os.remove(output_file)