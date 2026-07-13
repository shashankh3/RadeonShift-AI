# RadeonShift AI — Latest State Summary

> Handoff document. Describes current architecture, availability guarantees, key files, and known limitations as of latest release.

---

## Current Architecture

RadeonShift AI is a three-layer system:

| Layer | Host | Always Available |
|---|---|---|
| Frontend | Vercel (Next.js 16) | Yes |
| Deterministic Risk Engine | Next.js (Local/Browser) + FastAPI (Backend) | Yes |
| AI Translation & Audit | Vercel Serverless API Routes → Fireworks AI | Yes (when `FIREWORKS_API_KEY` is set) |
| Hardware Verification | FastAPI backend on AMD MI300X notebook via Pinggy | No — optional |

---

## What Is Always Available

When `FIREWORKS_API_KEY` is configured in Vercel:

- ✅ Deterministic architecture risk detection (runs locally before AI)
- ✅ CUDA → HIP translation (via `/api/translate` → Fireworks AI)
- ✅ MoA dual-agent audit (via `/api/audit` → Fireworks AI)
- ✅ Audit confidence score computed from real findings (with automatic score capping and explanation text)
- ✅ Translation latency measured and displayed
- ✅ ModeBanner reports `ai_only` when notebook is offline
- ✅ Emergency demo fallback if Fireworks itself fails

---

## What Depends on Notebook Connectivity

The AMD MI300X notebook (accessed via Pinggy tunnel) provides:

- ⚡ ROCm hardware telemetry (GPU name, ROCm version)
- ⚡ `hipcc` bare-metal compilation verification
- ⚡ Live benchmark execution (vector-add kernel)
- ⚡ `/pinggy/health` endpoint for mode detection
- ⚡ `/pinggy/report/zip` for ZIP report generation
- ⚡ `/pinggy/benchmark/vector-add` for live execution

---

## What Is Cached

When the AMD notebook is offline:

- 📦 `DEMO_BENCHMARK` — warp_reduction kernel cached benchmark
  - `elapsed_ms: 0.026`, `throughput_gbps: 3918`, `peak_pct: 74.0`
  - Captured on AMD Instinct MI300X (gfx942)
  - Labeled as cached, never presented as live
- 📦 Displayed in BenchmarkPanel with ⚠ "Cached MI300X Benchmark Evidence" label
- 📦 `gpu_name` contains `[Demo — cached evidence]` marker to prevent misclassification

---

## What Is Demo-Only

Activated automatically when both Fireworks AI and the notebook are unreachable, or explicitly forced via `NEXT_PUBLIC_DEMO_MODE=true`:

- 🎭 Bypasses backend and loads `wavefront_bug_sample.json`
- 🎭 Contains deterministic findings, AI findings, score logic, and metrics
- 🎭 Displays a "⚠️ Demo Mode (Static Sample)" badge in the UI
- 🎭 Report downloads as `RadeonShift_Migration_Report_demo.json`

---

## Key Files Per Layer

### Frontend / UI
| File | Responsibility |
|---|---|
| `src/components/Workspace.tsx` | Root layout, passes scorecard state |
| `src/components/TargetWorkspace.tsx` | Main output panel (tabs, analytics, telemetry) |
| `src/components/ModeBanner.tsx` | Mode indicator (full_stack / ai_only / demo_only) |
| `src/components/BenchmarkPanel.tsx` | Interactive benchmark runner + evidence display |
| `src/components/BenchmarkCard.tsx` | Stateless benchmark card (used for static rendering) |
| `src/components/AuditCard.tsx` | Renders individual finding cards |
| `src/components/Header.tsx` / `src/components/ModeBanner.tsx` | Infrastructure health and mode display |

### API Layer (Vercel Server-Side)
| File | Responsibility |
|---|---|
| `src/app/api/translate/route.ts` | Calls Fireworks AI for CUDA→HIP translation |
| `src/app/api/audit/route.ts` | Calls Fireworks AI for MoA dual-agent audit |

### Data Layer
| File | Responsibility |
|---|---|
| `src/lib/api.ts` | `translateCode()` + `runBenchmark()` + Demo Mode logic + `ScorecardData` interface |
| `src/lib/demoData.ts` | Fallback data structures |
| `src/lib/deterministic_detectors.ts` | Client-side rule engine for AMD portability risks |

### Backend (Optional — AMD Notebook)
| File | Responsibility |
|---|---|
| `backend/main.py` | FastAPI app entrypoint |
| `backend/api/routes.py` | `/health`, `/translate`, `/benchmark/*`, `/report`, `/report/zip` endpoints |
| `backend/services/ai_orchestrator.py` | MoA orchestration for backend/CI path |
| `backend/services/deterministic_detectors.py` | Standalone rule-based portability scanner |
| `backend/hero_kernels/` | CUDA + HIP reference kernels |

---

## Known Limitations

1. **ModeBanner cannot detect Fireworks failure** — it only polls `/pinggy/health`. If Fireworks fails but notebook is up, the banner shows `full_stack` incorrectly. The actual translation/audit failure is handled at the UI level via the `demo_only` scorecard.

2. **`/pinggy/report/zip` requires notebook** — Report ZIP download falls back to demo JSON when notebook is offline. A Vercel-hosted report generation route does not exist yet.

3. **`scorecard.benchmark` starts as `unavailable`** — Even in full-stack mode, benchmark data in the scorecard stays `unavailable` until the user explicitly clicks "Run Benchmark" in BenchmarkPanel. This is by design.

4. **Pinggy free subdomain changes on restart** — `next.config.ts` contains the hardcoded Pinggy URL. Must be updated each time the notebook restarts unless Pinggy Pro persistent subdomain is used.

5. **Demo mode detection is not surfaced in ModeBanner** — When Fireworks fails, the UI enters `demo_only` mode via the translation catch block, but the `ModeBanner` polls hardware health independently and may still show `ai_only`. This is acceptable behavior.
