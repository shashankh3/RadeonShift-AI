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

export const DEMO_WAVEFRONT_BUG_CUDA = `__global__ void warpReduceSum(int* input, int* output, int n) {
    int tid = threadIdx.x;
    int lane = tid % 32;
    int warpId = tid / 32;
    int val = 0;

    if (tid < n) {
        val = input[tid];
    }

    for (int offset = 16; offset > 0; offset >>= 1) {
        val += __shfl_down_sync(0xFFFFFFFF, val, offset);
    }

    if (lane == 0) {
        output[warpId] = val;
    }
}`;

export const DEMO_NAIVE_TRANSLATION_HIP = `__global__ void warpReduceSum(int* input, int* output, int n) {
    int tid = threadIdx.x;
    int lane = tid % 32;
    int warpId = tid / 32;
    int val = 0;

    if (tid < n) {
        val = input[tid];
    }

    for (int offset = 16; offset > 0; offset >>= 1) {
        val += __shfl_down_sync(0xFFFFFFFF, val, offset);
    }

    if (lane == 0) {
        output[warpId] = val;
    }
}`;

export const DEMO_RADEONSHIFT_FIXED_HIP = `__global__ void warpReduceSum(int* input, int* output, int n) {
    int tid = threadIdx.x;
    int lane = tid % warpSize;
    int warpId = tid / warpSize;
    int val = 0;

    if (tid < n) {
        val = input[tid];
    }

    for (int offset = warpSize / 2; offset > 0; offset >>= 1) {
        val += __shfl_down_sync(0xFFFFFFFFFFFFFFFF, val, offset);
    }

    if (lane == 0) {
        output[warpId] = val;
    }
}`;

export const DEMO_WAVEFRONT_BUG_FINDINGS = [
  {
    severity: "CRITICAL",
    category: "Wavefront Correctness",
    line: 3,
    context: "int lane = tid % 32;",
    finding: "Hardcoded 32-lane warp assumption. AMD MI300X (gfx942) uses a 64-lane wavefront. This silently produces incorrect reduction results because only 32 of 64 lanes are grouped correctly.",
    fix: "Replace literal 32 with the portable warpSize built-in, which resolves to 64 on AMD hardware.",
    auto_fixable: true,
    patch: "int lane = tid % warpSize;"
  },
  {
    severity: "CRITICAL",
    category: "Wavefront Correctness",
    line: 4,
    context: "int warpId = tid / 32;",
    finding: "Same hardcoded 32-lane assumption used to compute warp/wavefront index. This produces an incorrect number of output groups on AMD hardware.",
    fix: "Replace literal 32 with warpSize.",
    auto_fixable: true,
    patch: "int warpId = tid / warpSize;"
  },
  {
    severity: "HIGH",
    category: "Wavefront Correctness",
    line: 9,
    context: "for (int offset = 16; offset > 0; offset >>= 1)",
    finding: "Reduction loop starts at 16, which is correct only for a 32-lane warp. On AMD's 64-lane wavefront, this leaves half the lanes unreduced, corrupting the sum.",
    fix: "Start the reduction at warpSize / 2 instead of the literal 16.",
    auto_fixable: true,
    patch: "for (int offset = warpSize / 2; offset > 0; offset >>= 1)"
  },
  {
    severity: "MEDIUM",
    category: "Portability",
    line: 10,
    context: "__shfl_down_sync(0xFFFFFFFF, val, offset)",
    finding: "The 32-bit mask 0xFFFFFFFF assumes a 32-lane warp. On AMD's 64-lane wavefront, this mask does not cover all active lanes.",
    fix: "Use a 64-bit all-lanes mask on AMD targets.",
    auto_fixable: true,
    patch: "__shfl_down_sync(0xFFFFFFFFFFFFFFFF, val, offset)"
  }
] as const;
