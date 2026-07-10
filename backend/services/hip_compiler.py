import os
import shutil
import subprocess
import tempfile
import time

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
