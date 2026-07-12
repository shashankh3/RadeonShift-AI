# RadeonShift Evaluation Methodology

## Audit Accuracy Evaluation

### Test Set
- 20 CUDA kernel samples with known AMD-specific bugs
- Each sample has a ground-truth bug label (severity, category, line number)

### Metrics
- **Precision**: (True Positives) / (True Positives + False Positives)
  Measures false alarm rate — how often does RadeonShift flag something that isn't actually a bug?
- **Recall**: (True Positives) / (True Positives + False Negatives)
  Measures coverage — how many real bugs does RadeonShift catch?
- **Fix Accuracy**: (Correct Fixes) / (Total Fixes Suggested)
  Measures whether suggested patches actually compile and produce correct results on MI300X.

### Benchmark Validation
- Compile success rate across test set
- Correctness pass rate after fixes applied
- Performance delta: fixed HIP vs raw hipify-perl output
