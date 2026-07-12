# Final Credibility Fix Report

This document summarizes the comprehensive product truth and credibility audit applied to RadeonShift AI.

## Contradictions Fixed
- **The "Deterministic Translation" Contradiction**: The original architecture used `hipify-perl` for deterministic translation without LLMs, but the active Vercel frontend was actually routing translation through Fireworks AI. We have globally removed claims of "deterministic translation" and replaced them with truthful "AI-assisted CUDA kernel migration" claims.
- **The "Verified" Fallacy**: The UI was hardcoded to return `verification.status = "compile_verified"` for offline AI-only modes and demo fallbacks. We have strictly enforced that `compile_verified` only applies when actual hardware compilation evidence exists.

## Statuses Renamed
In `src/lib/api.ts` and `src/components/VerificationGate.tsx`:
- Removed `verified_with_warnings` and `STATIC ANALYSIS COMPLETE`.
- Added `ai_audited_not_compiled` for Fireworks AI live translations.
- Added `demo_artifact_not_compiled` for emergency demo fallback modes.
- Added `hardware_unavailable` and `cached_prior_evidence` to cleanly identify hardware absence.

## Components Updated
- `src/components/VerificationGate.tsx`: Rewritten to render truth-safe labels based on actual provenance.
- `src/lib/api.ts`: Separated `demo_artifact_not_compiled` and `ai_audited_not_compiled` from true `compile_verified`.
- `src/components/TargetWorkspace.tsx` and `BenchmarkPanel.tsx`: Fixed in prior sweeps to correctly label "Cached MI300X Benchmark Evidence" instead of claiming live hardware execution when offline.

## Phrases Removed/Reworded
- `100% deterministic compilation` ➡️ Removed entirely.
- `enterprise-grade DevSecOps pipeline` ➡️ `kernel-level CUDA-to-AMD migration assistant`
- `5,000x ROI` ➡️ `Significant ROI`
- `Zero hallucinations` ➡️ Removed entirely.
- `Raw hipify-perl output` ➡️ `Generated HIP translation`

## Exact Truth Model
The canonical truth model of RadeonShift AI is now defined across three modes:
1. **full_stack**: Fireworks AI live + AMD hardware live (Pinggy tunnel online). Hardware telemetry and compilation data are real.
2. **ai_only**: Fireworks AI live + AMD hardware offline. Translation and MoA audit are completely real and live. Hardware panels degrade to `Unavailable` or explicitly labeled `Cached prior evidence`.
3. **demo_only**: Emergency fallback. Fireworks API key is missing or network failure. Output relies entirely on embedded fallback payloads explicitly marked `demo_artifact`.

## Remaining Limitations
- **Backend Fallbacks**: The Python FastAPI backend container (`backend/Dockerfile`) still provisions `hipify-perl` to allow backend-only validation checks on the remote instance. While this is valid, it is no longer marketed as the "primary translation path."
- **Benchmark Falsification**: If the MI300X is offline, users see a hardcoded, cached benchmark. While the UI truthfully labels this as "Cached prior evidence," the payload originates from a static fallback array rather than a local database of past runs.

## Presenter Do/Don't Guidance
- **DO NOT** claim RadeonShift AI performs "autonomous repository-wide migrations." Frame it strictly as a kernel-level migration *assistant* and semantic *auditor*.
- **DO NOT** say the syntax translation is 100% perfect or deterministic. 
- **DO** emphasize the Fireworks AI MoA audit layer. The true value proposition is catching architectural lock-ins (like warp-32 assumptions) that plain syntax translators miss.
- **DO** lean into the "Graceful Degradation" if hardware is offline. Tell judges, "Because our notebook tunnel is down, the system gracefully falls back to showing cached benchmark evidence." Judges heavily reward transparency.
