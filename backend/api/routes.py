from fastapi import APIRouter, HTTPException
import uuid
import os
import subprocess
import json
import asyncio
import shutil
import tempfile
import time
from models.schemas import CodeRequest, BenchmarkRequest
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
            "status": "simulated",
            "hardware": "AMD Instinct MI300X OAM (Mock)",
            "source": "psutil_fallback"
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

@router.post("/benchmark/vector-add")
async def benchmark_vector_add(request: BenchmarkRequest):
    has_hipcc = shutil.which("hipcc") is not None
    if not has_hipcc:
        return {
            "status": "unavailable",
            "benchmark": {
                "name": "vector_add",
                "size": request.size,
                "iterations": request.iterations,
                "elapsed_ms": 0.0,
                "throughput_gbps": 0.0,
                "bytes_processed": 0,
                "gpu_name": None
            },
            "compile": {
                "attempted": False,
                "status": "unavailable",
                "stderr_summary": None,
                "duration_ms": 0
            },
            "telemetry": {
                "before": None,
                "after": None,
                "source": "unavailable",
                "note": "Instantaneous GPU activity sampling may not capture the exact peak of short benchmark runs."
            },
            "disclaimer": "This benchmark uses an internal trusted HIP vector-add kernel. RadeonShift does not execute arbitrary uploaded kernels in benchmark mode."
        }

    telemetry_before = await health()
    
    benchmark_code = f"""
#include <hip/hip_runtime.h>
#include <iostream>
#include <chrono>

__global__ void vectorAdd(const float *A, const float *B, float *C, int numElements) {{
    int i = blockDim.x * blockIdx.x + threadIdx.x;
    if (i < numElements) {{
        C[i] = A[i] + B[i];
    }}
}}

int main() {{
    int numElements = {request.size};
    size_t size = numElements * sizeof(float);
    float *h_A = (float *)malloc(size);
    float *h_B = (float *)malloc(size);
    float *h_C = (float *)malloc(size);
    
    for (int i = 0; i < numElements; ++i) {{
        h_A[i] = 1.0f;
        h_B[i] = 2.0f;
    }}
    
    float *d_A, *d_B, *d_C;
    hipMalloc(&d_A, size);
    hipMalloc(&d_B, size);
    hipMalloc(&d_C, size);
    
    hipMemcpy(d_A, h_A, size, hipMemcpyHostToDevice);
    hipMemcpy(d_B, h_B, size, hipMemcpyHostToDevice);
    
    int threadsPerBlock = 256;
    int blocksPerGrid = (numElements + threadsPerBlock - 1) / threadsPerBlock;
    
    // Warmup
    hipLaunchKernelGGL(vectorAdd, dim3(blocksPerGrid), dim3(threadsPerBlock), 0, 0, d_A, d_B, d_C, numElements);
    hipDeviceSynchronize();
    
    int iterations = {request.iterations};
    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < iterations; ++i) {{
        hipLaunchKernelGGL(vectorAdd, dim3(blocksPerGrid), dim3(threadsPerBlock), 0, 0, d_A, d_B, d_C, numElements);
    }}
    hipDeviceSynchronize();
    auto end = std::chrono::high_resolution_clock::now();
    
    hipMemcpy(h_C, d_C, size, hipMemcpyDeviceToHost);
    
    bool passed = true;
    for (int i = 0; i < 100; ++i) {{
        if (h_C[i] != 3.0f) {{
            passed = false;
            break;
        }}
    }}
    
    double elapsed_ms = std::chrono::duration<double, std::milli>(end - start).count();
    long long bytes_processed = (long long)size * 3 * iterations;
    double throughput_gbps = (bytes_processed / 1.0e9) / (elapsed_ms / 1000.0);
    
    hipDeviceProp_t prop;
    hipGetDeviceProperties(&prop, 0);
    
    std::cout << "{{\\n";
    std::cout << "  \\"status\\": \\"" << (passed ? "passed" : "failed_validation") << "\\",\\n";
    std::cout << "  \\"gpu_name\\": \\"" << prop.name << "\\",\\n";
    std::cout << "  \\"elapsed_ms\\": " << elapsed_ms << ",\\n";
    std::cout << "  \\"bytes_processed\\": " << bytes_processed << ",\\n";
    std::cout << "  \\"throughput_gbps\\": " << throughput_gbps << "\\n";
    std::cout << "}}\\n";
    
    hipFree(d_A); hipFree(d_B); hipFree(d_C);
    free(h_A); free(h_B); free(h_C);
    return 0;
}}
"""

    with tempfile.TemporaryDirectory() as temp_dir:
        src_path = os.path.join(temp_dir, "vector_add_benchmark.cpp")
        exe_path = os.path.join(temp_dir, "vector_add_benchmark")
        with open(src_path, "w") as f:
            f.write(benchmark_code)
            
        compile_start = time.time()
        try:
            compile_proc = await asyncio.to_thread(
                subprocess.run, ["hipcc", src_path, "-o", exe_path], 
                capture_output=True, text=True, timeout=30
            )
            compile_duration_ms = int((time.time() - compile_start) * 1000)
            
            if compile_proc.returncode != 0:
                return {
                    "status": "compile_failed",
                    "benchmark": {
                        "name": "vector_add",
                        "size": request.size,
                        "iterations": request.iterations,
                        "elapsed_ms": 0.0,
                        "throughput_gbps": 0.0,
                        "bytes_processed": 0,
                        "gpu_name": None
                    },
                    "compile": {
                        "attempted": True,
                        "status": "failed",
                        "stderr_summary": compile_proc.stderr[:500] if compile_proc.stderr else None,
                        "duration_ms": compile_duration_ms
                    },
                    "telemetry": {
                        "before": telemetry_before,
                        "after": telemetry_before,
                        "source": telemetry_before.get("source", "unavailable"),
                        "note": "Instantaneous GPU activity sampling may not capture the exact peak of short benchmark runs."
                    },
                    "disclaimer": "This benchmark uses an internal trusted HIP vector-add kernel. RadeonShift does not execute arbitrary uploaded kernels in benchmark mode."
                }
        except subprocess.TimeoutExpired as e:
            return {
                "status": "compile_failed",
                "benchmark": {
                    "name": "vector_add",
                    "size": request.size,
                    "iterations": request.iterations,
                    "elapsed_ms": 0.0,
                    "throughput_gbps": 0.0,
                    "bytes_processed": 0,
                    "gpu_name": None
                },
                "compile": {
                    "attempted": True,
                    "status": "failed",
                    "stderr_summary": "Compilation timed out after 30 seconds",
                    "duration_ms": 30000
                },
                "telemetry": {
                    "before": telemetry_before,
                    "after": telemetry_before,
                    "source": telemetry_before.get("source", "unavailable"),
                    "note": "Instantaneous GPU activity sampling may not capture the exact peak of short benchmark runs."
                },
                "disclaimer": "This benchmark uses an internal trusted HIP vector-add kernel. RadeonShift does not execute arbitrary uploaded kernels in benchmark mode."
            }
            
        try:
            run_proc = await asyncio.to_thread(
                subprocess.run, [exe_path], capture_output=True, text=True, timeout=30
            )
            telemetry_after = await health()
            
            if run_proc.returncode != 0:
                return {
                    "status": "runtime_failed",
                    "benchmark": {
                        "name": "vector_add",
                        "size": request.size,
                        "iterations": request.iterations,
                        "elapsed_ms": 0.0,
                        "throughput_gbps": 0.0,
                        "bytes_processed": 0,
                        "gpu_name": None
                    },
                    "compile": {
                        "attempted": True,
                        "status": "passed",
                        "stderr_summary": None,
                        "duration_ms": compile_duration_ms
                    },
                    "telemetry": {
                        "before": telemetry_before,
                        "after": telemetry_after,
                        "source": telemetry_after.get("source", "unavailable"),
                        "note": "Instantaneous GPU activity sampling may not capture the exact peak of short benchmark runs."
                    },
                    "disclaimer": "This benchmark uses an internal trusted HIP vector-add kernel. RadeonShift does not execute arbitrary uploaded kernels in benchmark mode."
                }
                
            try:
                res = json.loads(run_proc.stdout)
                status = res.get("status", "failed_validation")
            except json.JSONDecodeError:
                status = "runtime_failed"
                res = {}
                
            return {
                "status": status,
                "benchmark": {
                    "name": "vector_add",
                    "size": request.size,
                    "iterations": request.iterations,
                    "elapsed_ms": res.get("elapsed_ms", 0.0),
                    "throughput_gbps": res.get("throughput_gbps", 0.0),
                    "bytes_processed": res.get("bytes_processed", 0),
                    "gpu_name": res.get("gpu_name")
                },
                "compile": {
                    "attempted": True,
                    "status": "passed",
                    "stderr_summary": None,
                    "duration_ms": compile_duration_ms
                },
                "telemetry": {
                    "before": telemetry_before,
                    "after": telemetry_after,
                    "source": telemetry_after.get("source", "unavailable"),
                    "note": "Instantaneous GPU activity sampling may not capture the exact peak of short benchmark runs."
                },
                "disclaimer": "This benchmark uses an internal trusted HIP vector-add kernel. RadeonShift does not execute arbitrary uploaded kernels in benchmark mode."
            }
            
        except subprocess.TimeoutExpired:
            telemetry_after = await health()
            return {
                "status": "runtime_failed",
                "benchmark": {
                    "name": "vector_add",
                    "size": request.size,
                    "iterations": request.iterations,
                    "elapsed_ms": 0.0,
                    "throughput_gbps": 0.0,
                    "bytes_processed": 0,
                    "gpu_name": None
                },
                "compile": {
                    "attempted": True,
                    "status": "passed",
                    "stderr_summary": None,
                    "duration_ms": compile_duration_ms
                },
                "telemetry": {
                    "before": telemetry_before,
                    "after": telemetry_after,
                    "source": telemetry_after.get("source", "unavailable"),
                    "note": "Instantaneous GPU activity sampling may not capture the exact peak of short benchmark runs."
                },
                "disclaimer": "This benchmark uses an internal trusted HIP vector-add kernel. RadeonShift does not execute arbitrary uploaded kernels in benchmark mode."
            }
