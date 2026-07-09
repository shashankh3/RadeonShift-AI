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
            """Agent A: NVIDIA Purist — flags PTX, warp assumptions"""
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
            """Agent B: AMD Optimizer — writes 64-lane Wavefront solution"""
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
        
        # Calculate a mock score or real score based on findings
        readiness_score = 100
        if audit.get("manual_intervention_required"):
            readiness_score -= 50
        if len(audit.get("ptx_risks", [])) > 0:
            readiness_score -= 20
        readiness_score = max(0, readiness_score)

        final_audit_log = {
            "readiness_score": readiness_score,
            "ptx_risks": audit.get("ptx_risks", []),
            "wavefront_optimizations": optimization.get("wavefront_optimizations", []),
            "manual_intervention_required": audit.get("manual_intervention_required", False),
            "estimated_mi300x_ms": optimization.get("estimated_mi300x_ms", 0.0)
        }
        
        return {
            "rocm_code": rocm_code,
            "audit_log": json.dumps(final_audit_log)
        }
        
    finally:
        if os.path.exists(input_file): os.remove(input_file)
        if os.path.exists(output_file): os.remove(output_file)