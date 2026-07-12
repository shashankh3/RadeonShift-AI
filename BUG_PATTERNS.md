# RadeonShift Bug Pattern Taxonomy

## Detection Rules

| # | Rule Name | Severity | Category | Description |
|---|-----------|----------|----------|-------------|
| 1 | WarpSize Hardcode | HIGH | Wavefront Correctness | Detects literal `32` in warp logic — AMD wavefront is 64 on gfx942 |
| 2 | __shfl_sync Mask | HIGH | Wavefront Correctness | Detects NVIDIA-specific shuffle masks (0xFFFFFFFF assumes 32 lanes) |
| 3 | Inline PTX Assembly | CRITICAL | API Compatibility | Detects `__asm__` PTX blocks — not supported on AMD |
| 4 | Cooperative Groups Tiling | MEDIUM | Wavefront Correctness | Detects CG tiling that assumes 32-lane warps |
| 5 | hip_global Qualifier | LOW | Boilerplate | Detects malformed HIP kernel qualifier form |
| 6 | Duplicate main() | LOW | Boilerplate | Detects leftover boilerplate from incomplete translation |
