export const DEMO_CUDA_SOURCE = `__global__ void warpReduce(int* input, int* output, int n) {
    int tid = threadIdx.x;
    int localSum = 0;
    int lane = tid % 32;
    int warpId = tid / 32;

    if (tid < n) {
        localSum = input[tid];
    }

    for (int offset = 16; offset > 0; offset >>= 1) {
        localSum += __shfl_down_sync(0xFFFFFFFF, localSum, offset);
    }

    if (lane == 0) {
        output[warpId] = localSum;
    }
}`;

export const DEMO_HIP_OUTPUT = `__global__ void warpReduce(int* input, int* output, int n) {
    int tid = threadIdx.x;
    int localSum = 0;
    int lane = tid % warpSize;
    int warpId = tid / warpSize;

    if (tid < n) {
        localSum = input[tid];
    }

    for (int offset = warpSize / 2; offset > 0; offset >>= 1) {
        localSum += __shfl_down_sync(0xFFFFFFFFFFFFFFFF, localSum, offset);
    }

    if (lane == 0) {
        output[warpId] = localSum;
    }
}`;

export const DEMO_AUDIT_FINDINGS = [
  {
    severity: "HIGH",
    category: "Wavefront Correctness",
    line: 4,
    context: "int lane = tid % 32;",
    finding: "Hardcoded warpSize=32 assumption. AMD wavefront is 64 on gfx942. This will silently produce wrong results on MI300X.",
    fix: "Replace literal 32 with warpSize query.",
    auto_fixable: true,
    patch: "int lane = tid % warpSize;"
  },
  {
    severity: "MEDIUM",
    category: "Wavefront Correctness",
    line: 10,
    context: "for (int offset = 16; offset > 0; offset >>= 1)",
    finding: "Reduction offset is hardcoded for 32-lane warps. AMD wavefront-64 should begin at warpSize / 2.",
    fix: "Use warpSize / 2 instead of literal 16.",
    auto_fixable: true,
    patch: "for (int offset = warpSize / 2; offset > 0; offset >>= 1)"
  }
] as const;

export const DEMO_BENCHMARK = {
  kernel: "warp_reduction",
  compile_status: "SUCCESS",
  elapsed_ms: 0.026,
  throughput_gbps: 3918,
  peak_pct: 74.0,
  correctness: "PASS — wavefront-64 fix verified",
  hardware: "AMD Instinct MI300X (gfx942)",
  timestamp: "2026-07-12T14:32:00+05:30",
  cached: true,
  mode: "fallback"
} as const;

export const DEMO_REPORT = {
  translation: {
    status: "complete",
    input_language: "CUDA",
    output_language: "HIP",
    tool: "fireworks_live",
    output: DEMO_HIP_OUTPUT
  },
  audit: {
    total_findings: DEMO_AUDIT_FINDINGS.length,
    findings: DEMO_AUDIT_FINDINGS,
    critical_count: 0,
    high_count: 1,
    medium_count: 1,
    low_count: 0,
    auto_fixable_count: 2
  },
  benchmark: DEMO_BENCHMARK,
  hardware: {
    model: "AMD Instinct MI300X (gfx942) - DEMO MODE",
    mode: "fallback"
  },
  migration_confidence_score: 75,
  timestamp: "2026-07-12T14:32:00+05:30",
  demo_mode: true
};
