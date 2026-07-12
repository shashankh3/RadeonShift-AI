# RadeonShift Verification Model

RadeonShift AI operates as an enterprise-grade DevSecOps pipeline for CUDA-to-HIP migration. A core tenet of our design philosophy is **factual transparency**. We strictly distinguish between static analysis, compilation verification, and runtime execution.

## Trust & Verification Principles

1. **Deterministic Translation First**: Syntax is translated using AMD's `hipify` toolset. LLMs are never used to blindly rewrite syntax, only to audit and recommend.
2. **No Fabricated Benchmarks**: The platform never reports simulated runtime execution speeds or performance parity unless a kernel was explicitly executed and measured in a secure harness. When in AI-Only mode (hardware offline), cached benchmark evidence from verified runs is explicitly labeled.
3. **Transparent Evidence**: The Verification Gate surfaces raw compiler output and deep static analysis (PTX, warp sizes, API remnants). 
4. **Truthful Scorecard Policy**: Scorecard metrics are derived strictly from the current execution mode (AI-only vs Full-Stack), clearly labeling offline capabilities and avoiding fake hardware telemetry.

## Execution Policy

**Uploaded kernels are never executed automatically.**

Why?
- **Security**: Executing arbitrary untrusted C++ code directly on host infrastructure or GPUs introduces severe security and stability risks.
- **Semantic Correctness**: Compiling successfully does not guarantee the logic is semantically correct. Kernel execution requires a user-provided, domain-specific test harness to validate output data arrays.
- **Hardware Dependencies**: Many kernels require pre-allocated device memory, specific block/grid sizes, and populated host data to execute without segfaulting.

For execution testing, users should integrate the RadeonShift output into their local test harness or CI environment.

## The Verification Gate

To bridge the gap between static translation and runtime testing, RadeonShift implements a **Verification Gate**:

- **Static Portability Scan**: Evaluates the code for NVIDIA vendor lock-in (inline PTX, warpSize hardcoding, cuBLAS/cuFFT dependencies).
- **Compile Verification**: If `hipcc` is available on the backend host, the code is passed to the compiler to ensure it produces a valid object file without syntax or linking errors.

### Known Limitations
- **Inline PTX**: Code relying heavily on inline PTX assembly may fail the compiler check until manually rewritten using AMD's `__builtin_amdgcn` intrinsics.
- **Runtime Performance**: A `compile_verified` status means the code is syntactically valid for ROCm; it does not guarantee optimal performance. Agent B provides recommendations, but manual profiling via `rocprof` is always recommended.
