from fastapi import APIRouter, HTTPException
import uuid
import os
import subprocess
import json
import asyncio
import shutil
from models.schemas import CodeRequest
from services.verification import build_verification_result
from services.ai_orchestrator import call_agent_a, call_agent_b
from core.config import FIREWORKS_API_KEY

router = APIRouter()

@router.get("/health")
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

@router.get("/verification-capabilities")
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

@router.post("/translate")
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
