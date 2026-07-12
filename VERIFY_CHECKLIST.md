# RadeonShift AI — Verification Checklist

> This is a practical QA checklist for maintainers. It documents exactly what to verify before release, after architecture changes, or when debugging runtime behavior.

---

## Section 1: Runtime Modes

### Full-Stack Mode (`full_stack`)
Expected behavior when both Fireworks AI and AMD notebook are online:

- [ ] `ModeBanner` shows 🟢 and reports "Full Stack Online — Fireworks AI + AMD MI300X Connected"
- [ ] Hardware name is shown next to AI label in ModeBanner
- [ ] Translation runs via `/api/translate` (Vercel → Fireworks AI)
- [ ] Audit runs via `/api/audit` (Vercel → Fireworks AI)
- [ ] `scorecard.execution_mode === 'full_stack'`
- [ ] `scorecard.hardware.status === 'online'`
- [ ] Telemetry panel shows real GPU name and ROCm version (not "Offline")
- [ ] Benchmark panel shows "Live Benchmark Execution Verified" after run
- [ ] Benchmark source label reads "Source: live hardware"
- [ ] MiniStat "GPU" shows "Detected" (not "Unavailable")
- [ ] MiniStat "Status" shows "Full Stack"

### AI-Only Mode (`ai_only`)
Expected behavior when Fireworks AI is online but AMD notebook is offline:

- [ ] `ModeBanner` shows 🟡 and reports "AI-Only Mode — Fireworks AI Online, AMD Hardware Offline"
- [ ] Translation still completes via `/api/translate`
- [ ] Audit still completes via `/api/audit`
- [ ] `scorecard.execution_mode === 'ai_only'`
- [ ] `scorecard.hardware.status === 'offline'`
- [ ] Telemetry panel shows "Offline" for GPU, does not show Platform/ROCm row
- [ ] Benchmark panel shows "Benchmark unavailable" or cached evidence with ⚠ label
- [ ] Benchmark source reads "Source: cached evidence" (never "live hardware")
- [ ] MiniStat "GPU" shows "Unavailable"
- [ ] MiniStat "Status" shows "AI Only"
- [ ] Confidence score is computed from actual Fireworks audit findings

### Demo-Only Mode (`demo_only`)
Expected behavior when both Fireworks and notebook are offline:

- [ ] `ModeBanner` shows 🟠 and reports "Emergency Demo Mode"
- [ ] Translation returns `DEMO_HIP_OUTPUT` (warpReduce kernel)
- [ ] Audit returns `DEMO_AUDIT_FINDINGS` (1 HIGH + 1 MEDIUM)
- [ ] `scorecard.execution_mode === 'demo_only'`
- [ ] `scorecard.translation.source === 'demo_artifact'`
- [ ] `scorecard.audit.source === 'demo_artifact'`
- [ ] Benchmark shows cached evidence labeled "⚠ Cached MI300X Benchmark Evidence"
- [ ] Telemetry latency shows "N/A" (not a fake number)
- [ ] Demo mode banner note appears: "⚠️ Using offline demo artifacts"
- [ ] Report download produces `RadeonShift_Migration_Report_demo.json`

---

## Section 2: Truthfulness Rules

### Live vs Cached vs Demo Labels

- [ ] Live translation: `scorecard.translation.source === 'fireworks_live'`
- [ ] Cached/demo translation: `scorecard.translation.source === 'demo_artifact'`
- [ ] Live audit: `scorecard.audit.source === 'fireworks_live'`
- [ ] Demo audit: `scorecard.audit.source === 'demo_artifact'`
- [ ] Live benchmark: `scorecard.benchmark.status === 'live'`
- [ ] Cached benchmark: `scorecard.benchmark.status === 'cached'`
- [ ] Unavailable benchmark: `scorecard.benchmark.status === 'unavailable'`

### Hardware Claims

- [ ] GPU name is `null` when hardware is offline — never shows "MI300X" as if live
- [ ] ROCm version is `null` when hardware is offline — row hidden from Telemetry panel
- [ ] `scorecard.hardware.telemetry_available` is `false` when notebook is offline
- [ ] No "GPU Verified" or "Verified" label shows when hardware is not online
- [ ] `BackendStatusPanel` hardware row shows "OFFLINE" when notebook unreachable

### Benchmark Provenance

- [ ] `BenchmarkCard` never shows "Live Benchmark Execution Verified" unless `mode === 'live_rocm'`
- [ ] `BenchmarkPanel` never shows "Live Benchmark Execution Verified" unless `gpu_name` does NOT contain "Demo"
- [ ] Cached benchmark footer always reads: "Benchmark values shown are from a prior verified AMD MI300X run"
- [ ] Cached benchmark hardware label includes "* Captured on prior run"
- [ ] Demo benchmark fallback `gpu_name` contains "[Demo — cached evidence]" marker

### Translation Provenance

- [ ] `/api/translate` returns `result_source: 'fireworks_live'`
- [ ] `scorecard.translation.latency_ms` is a real measured value (from `performance.now()`)
- [ ] Demo fallback has `latency_ms: null` and TelemetryPanel shows "N/A"

### Audit Provenance

- [ ] `/api/audit` returns `result_source: 'fireworks_live'`
- [ ] `scorecard.audit.confidence_score` is computed: `100 - (25 * crit) - (20 * high) - (5 * med) - (1 * low)`
- [ ] Confidence score defaults to `null` (shows "—") before first translation
- [ ] No static "100" is ever shown before a real audit has been performed

---

## Section 3: Manual QA Steps

### 1. Notebook Offline — Translation Still Works
1. Disconnect the AMD notebook (stop Pinggy or uvicorn)
2. Load any CUDA kernel in the Source Editor
3. Click "Migrate to ROCm"
4. **Expected:** Translation completes with real HIP code (not demo artifact)
5. **Expected:** ModeBanner shows 🟡 AI-Only Mode
6. **Expected:** `scorecard.execution_mode === 'ai_only'`

### 2. Notebook Offline — Audit Still Works
1. Same setup as above
2. After translation, click "Architecture Analytics" tab
3. **Expected:** Real audit findings are shown (from Fireworks, not static demo data)
4. **Expected:** `scorecard.audit.source === 'fireworks_live'`
5. **Expected:** Confidence score reflects actual finding counts

### 3. Notebook Offline — Benchmark Becomes Unavailable or Cached
1. Click "Architecture Analytics" → "Run Benchmark"
2. **Expected:** Result shows "⚠ Cached MI300X Benchmark Evidence" (never "Live Benchmark Execution Verified")
3. **Expected:** Source badge reads "Source: cached evidence"
4. **Expected:** Footer includes "Captured on prior run"
5. **Expected:** `gpu_name` contains "[Demo — cached evidence]"

### 4. Notebook Reconnects — Flips to Full Stack
1. Start the AMD notebook + Pinggy tunnel
2. Wait for `ModeBanner` poll interval (30s) or refresh
3. **Expected:** ModeBanner flips to 🟢 Full Stack
4. **Expected:** Hardware name appears next to AI label
5. **Expected:** `scorecard.hardware.status === 'online'`

### 5. Report Download — Verify Mode Fields
1. Perform a translation in ai_only mode
2. Click "Download Migration Report (.zip)"
3. If notebook is offline: download is `RadeonShift_Migration_Report_demo.json`
4. Open the file and verify:
   - `demo_mode: true` is present
   - No hardware claims in the data
   - Findings match what was shown in the UI

### 6. No Client-Side Secret Exposure
1. Open browser DevTools → Network tab
2. Trigger a translation
3. **Expected:** No request to `api.fireworks.ai` originates from the browser
4. **Expected:** All Fireworks calls go through `/api/translate` or `/api/audit`
5. **Expected:** No `FIREWORKS_API_KEY` visible in any client-side bundle or network request

---

## Section 4: Failure Cases

### Fireworks Unavailable (but notebook is up)
- Translation fails → catches exception → falls back to `demo_only` mode
- `scorecard.execution_mode === 'demo_only'`
- `DEMO_HIP_OUTPUT` is returned
- ModeBanner shows 🟠 Emergency Demo Mode
- Audit findings are demo artifacts

### Notebook Unavailable (but Fireworks is up)
- Translation succeeds via Vercel AI route
- Audit succeeds via Vercel AI route
- `scorecard.execution_mode === 'ai_only'`
- Hardware fields in scorecard are `null`
- Benchmark returns cached evidence (via demo fallback in `runBenchmark`)
- ModeBanner shows 🟡 AI-Only

### Both Unavailable
- Translation throws → catches → returns `DEMO_HIP_OUTPUT` with `demo_only` scorecard
- `ModeBanner` polls health → fails → shows 🟡 AI-Only (fallback; note: ModeBanner cannot detect Fireworks failure from client)
- All findings are demo artifacts
- Report download produces JSON with `demo_mode: true`

### Cached Benchmark Shown
- `runBenchmark` throws (notebook offline)
- Returns `DEMO_BENCHMARK` with `gpu_name` containing "[Demo — cached evidence]"
- BenchmarkPanel shows "Cached MI300X Benchmark Evidence" with ⚠ icon
- Footer: "Benchmark values shown are from a prior verified AMD MI300X run. Live hardware is currently unavailable."

### Emergency Demo Mode Shown
- Triggered only when `/api/translate` itself throws (Fireworks + Vercel route both fail)
- All UI shows preloaded demo artifacts
- Banner shows 🟠 Emergency Demo Mode
- `verification.demo_mode === true`
- Download produces `RadeonShift_Migration_Report_demo.json`
