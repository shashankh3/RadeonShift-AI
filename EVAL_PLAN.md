# RadeonShift Evaluation Methodology

## Overview

RadeonShift uses a multi-layer verification approach. Evaluation is separated by what is always available (AI audit) vs what requires hardware (compile/benchmark).

---

## AI Audit Evaluation (Always Available)

### Test Set
- 20 CUDA kernel samples with known AMD-specific bugs
- Each sample has a ground-truth bug label (severity, category, line number)
- Samples run through `/api/audit` → Fireworks AI MoA pipeline

### Metrics
- **Precision**: (True Positives) / (True Positives + False Positives)
  Measures false alarm rate — how often does RadeonShift flag something that isn't actually a bug?
- **Recall**: (True Positives) / (True Positives + False Negatives)
  Measures coverage — how many real bugs does RadeonShift catch?
- **Fix Accuracy**: (Correct Fixes) / (Total Fixes Suggested)
  Measures whether suggested patches actually compile and produce correct results on MI300X.
- **Confidence Score Calibration**: Does the computed confidence score correlate with actual portability?

---

## Hardware Verification Evaluation (Requires AMD Notebook)

### Benchmark Validation
- Compile success rate across test set (via `hipcc` on MI300X)
- Correctness pass rate after fixes applied
- Performance delta: fixed HIP vs raw hipify-perl output
- Throughput (GB/s) and % of MI300X peak bandwidth

---

## Runtime Modes Tested

| Mode | What is evaluated |
|---|---|
| `full_stack` | Full pipeline including compile + benchmark |
| `ai_only` | AI translation + audit only, no hardware |
| `demo_only` | Demo artifact integrity, not real evaluation |

---

## Truthfulness Criteria

Evaluation results must only count metrics actually computed in the current session:

- Confidence score must derive from real audit findings (not hardcoded)
- Benchmark data must be labeled `live` or `cached` based on actual source
- No evaluation metric may be fabricated or statically hardcoded in the output

---

## Notes

- Hardware benchmarks depend on AMD MI300X notebook connectivity
- If notebook is offline during evaluation, only AI audit metrics apply
- Cached benchmark evidence is not used for evaluation scoring (it is labeled as prior evidence)
