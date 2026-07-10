import hashlib
from datetime import datetime, timezone
from services.static_scanner import perform_static_portability_scan
from services.hip_compiler import attempt_hip_compile

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
            "gpu": telemetry.get("hardware") if telemetry.get("source") in ["live_rocm_smi", "psutil_fallback"] else None
        }
    }
