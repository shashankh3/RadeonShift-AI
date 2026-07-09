#!/usr/bin/env python3
"""
RadeonShift CLI Scanner — Batch Migration Feasibility Tool
Scans a directory recursively for CUDA (.cu/.cuh) files and outputs
a terminal report with MI300X migration readiness metrics.
"""
import os
import re
import sys
import json
from pathlib import Path

PTX_PATTERN = re.compile(r"asm\s*(\(|{)", re.IGNORECASE)
WARP32_PATTERN = re.compile(r"32|warpSize|threadIdx\.x", re.IGNORECASE)
SHARED_MEM_PATTERN = re.compile(r"__shared__|sharedMemory", re.IGNORECASE)
CUBLAS_PATTERN = re.compile(r"cublas|cusparse|cufft|curand|cusolver", re.IGNORECASE)
CUDA_EXTENSIONS = {".cu", ".cuh"}

def scan_file(filepath: str) -> dict:
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
    except Exception as e:
        return {"file": filepath, "error": str(e), "status": "unreadable"}
    line_count = content.count("\n") + 1
    ptx_hits = len(PTX_PATTERN.findall(content))
    warp32_hits = len(WARP32_PATTERN.findall(content))
    shared_hits = len(SHARED_MEM_PATTERN.findall(content))
    cublas_hits = len(CUBLAS_PATTERN.findall(content))
    risk_factors = 0
    manual_rewrite = False
    if ptx_hits > 0:
        risk_factors += 3
        manual_rewrite = True
    if warp32_hits > 0:
        risk_factors += 2
    if cublas_hits > 0:
        risk_factors += 1
    max_risk = max(1, ptx_hits * 3 + warp32_hits * 2 + cublas_hits + 1)
    readiness = max(0, 100 - (risk_factors * 100 // max_risk))
    return {
        "file": filepath, "lines": line_count, "ptx_risks": ptx_hits,
        "warp32_assumptions": warp32_hits, "shared_memory_usage": shared_hits,
        "cublas_dependencies": cublas_hits, "manual_rewrite_required": manual_rewrite,
        "readiness_score": readiness, "status": "manual_rewrite" if manual_rewrite else "automatable",
    }

def scan_directory(root_dir: str) -> list:
    results = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in {".git", "node_modules", "__pycache__", "venv", ".venv"}]
        for filename in filenames:
            if Path(filename).suffix in CUDA_EXTENSIONS:
                filepath = os.path.join(dirpath, filename)
                results.append(scan_file(filepath))
    return results

def print_report(results: list):
    total = len(results)
    if total == 0:
        print("\n❌ No CUDA files (.cu/.cuh) found in the specified directory.\n")
        return
    automatable = sum(1 for r in results if r.get("status") == "automatable")
    manual = sum(1 for r in results if r.get("status") == "manual_rewrite")
    total_lines = sum(r.get("lines", 0) for r in results)
    avg_readiness = sum(r.get("readiness_score", 0) for r in results) // total
    total_ptx = sum(r.get("ptx_risks", 0) for r in results)
    print("\n" + "=" * 60)
    print("  RadeonShift MI300X Migration Feasibility Report")
    print("=" * 60)
    print(f"  Files Scanned:        {total}")
    print(f"  Total Lines of CUDA:  {total_lines:,}")
    print(f"  Automatable Files:    {automatable}")
    print(f"  Manual Rewrite:       {manual}")
    print(f"  PTX Risks Found:      {total_ptx}")
    print(f"  MI300X Readiness:     {avg_readiness}%")
    print("=" * 60)
    if manual > 0:
        print("\n  ⚠️  Files requiring manual PTX rewrites:")
        for r in results:
            if r.get("manual_rewrite_required"):
                print(f"     → {r['file']} ({r['ptx_risks']} PTX blocks)")
    print("\n  Detailed per-file breakdown:")
    print("-" * 60)
    for r in results:
        status_icon = "🔴" if r.get("manual_rewrite_required") else "🟢"
        print(f"  {status_icon} {r['file']}")
        print(f"     Lines: {r.get('lines', 0)} | PTX: {r.get('ptx_risks', 0)} | "
              f"Warp32: {r.get('warp32_assumptions', 0)} | "
              f"cuBLAS: {r.get('cublas_dependencies', 0)} | "
              f"Readiness: {r.get('readiness_score', 0)}%")
    print("-" * 60)
    recommendation = 'Ready for automated migration via RadeonShift.' if manual == 0 else f'{manual} file(s) require manual review before automation.'
    print(f"\n  Recommendation: {recommendation}")
    print("\n" + "=" * 60 + "\n")

def main():
    if len(sys.argv) < 2:
        print("Usage: python radeonshift_scanner.py <directory_path> [--json]")
        print("  --json    Output results as JSON instead of terminal report")
        sys.exit(1)
    root_dir = sys.argv[1]
    if not os.path.isdir(root_dir):
        print(f"Error: '{root_dir}' is not a valid directory.")
        sys.exit(1)
    results = scan_directory(root_dir)
    if "--json" in sys.argv:
        print(json.dumps(results, indent=2))
    else:
        print_report(results)

if __name__ == "__main__":
    main()
