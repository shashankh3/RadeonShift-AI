import re

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
