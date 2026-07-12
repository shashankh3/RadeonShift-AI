# RadeonShift Bug Pattern Taxonomy

## Detection Rules

These patterns are detected by the MoA audit pipeline (Fireworks AI — Agent A: NVIDIA Purist + Agent B: AMD Optimizer) and by the static `radeonshift_scanner.py` pre-scan.

| # | Rule Name | Severity | Category | Description |
|---|-----------|----------|----------|-------------|
| 1 | WarpSize Hardcode | HIGH | Wavefront Correctness | Detects literal `32` in warp logic — AMD wavefront is 64 on gfx942 |
| 2 | __shfl_sync Mask | HIGH | Wavefront Correctness | Detects NVIDIA-specific shuffle masks (`0xFFFFFFFF` assumes 32 lanes) |
| 3 | Inline PTX Assembly | CRITICAL | API Compatibility | Detects `__asm__` PTX blocks — not supported on AMD |
| 4 | Cooperative Groups Tiling | MEDIUM | Wavefront Correctness | Detects CG tiling that assumes 32-lane warps |
| 5 | hip_global Qualifier | LOW | Boilerplate | Detects malformed HIP kernel qualifier form |
| 6 | Duplicate main() | LOW | Boilerplate | Detects leftover boilerplate from incomplete translation |

---

## Detection Path

1. **Static Scanner** (`radeonshift_scanner.py`) — runs regex-based pre-scan for known patterns
2. **Agent A (NVIDIA Purist)** — reviews translated HIP code for vendor lock-in, PTX risks, warp assumptions
3. **Agent B (AMD Optimizer)** — suggests MI300X-specific optimizations (wavefront-64, HBM3 coalescing)

Both agents run in parallel via the `/api/audit` Vercel route using Fireworks AI.

---

## Severity Scoring

Confidence score = `100 - (25 × CRITICAL) - (20 × HIGH) - (5 × MEDIUM) - (1 × LOW)`

This is computed at runtime from actual audit findings returned by Fireworks AI — it is never hardcoded.

---

## Notes

- Detection accuracy depends on Fireworks AI model quality and prompt design
- Static scanner catches structural patterns; AI agents catch semantic and architectural risks
- Hardware verification (compile + run) is the final authority, when available
