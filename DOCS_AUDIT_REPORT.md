# RadeonShift AI Documentation Audit Report

This report summarizes the documentation truth-alignment pass performed against the current codebase, with special focus on `pitch_deck.md` / `pitch_deck.pdf`.

## Current Verified Product Model

- **Primary web path:** Next.js frontend calls `/api/translate` and `/api/audit`, which call Fireworks AI server-side.
- **Optional hardware path:** `/pinggy/*` routes proxy to a FastAPI backend exposed through Pinggy.
- **Hardware evidence:** When the backend has ROCm tools available, it can provide `rocm-smi` telemetry, `hipcc` compile checks, report ZIP generation, and trusted benchmark execution.
- **Uploaded kernels:** They are not automatically executed. Runtime benchmarking is limited to trusted internal benchmark kernels unless a safe application harness is provided externally.
- **Fallback modes:** The UI distinguishes `full_stack`, `ai_only`, and `demo_only`, and labels live/cached/demo/unavailable evidence.

## Key Mismatches Found

| Area | Previous Risk | Resolution |
|---|---|---|
| Pitch deck hardware claims | Implied translated/uploaded kernels are always compiled and executed on MI300X | Reworded to optional compile-check evidence and trusted benchmark execution |
| Pitch deck scoring | Claimed `100/100` proves no hidden risks | Reworded score as computed from actual audit findings with caps for risky kernels |
| Runtime wording | Described routes as Vercel/Next.js Edge without code-level Edge runtime declaration | Reworded to Vercel / Next.js API routes |
| Business claims | Used hard ROI/TAM language without implementation-backed validation | Marked as illustrative and aligned TAM to `$4.2B` model from `BUSINESS.md` |
| Demo script | Included “perfect”, fully headless GitHub Action, and product-maturity overclaims | Replaced with provenance-safe presentation language |
| Stale references | Mentioned missing `BackendStatusPanel` and incorrect backend service paths | Updated to actual files/components |
| Cached benchmark values | Frontend demo scorecard used values inconsistent with `DEMO_BENCHMARK` and docs | Aligned `src/lib/api.ts` to `DEMO_BENCHMARK` values |

## Files Updated

- `pitch_deck.md`
- `README.md`
- `docs/architecture.md`
- `docs/verification-model.md`
- `docs/demo-script.md`
- `LATEST_STATE_SUMMARY.md`
- `BUSINESS.md`
- `docs/judging-alignment.md`
- `VERIFY_CHECKLIST.md`
- `src/lib/api.ts`

## Pitch Deck PDF Status

`pitch_deck.pdf` must be regenerated from `pitch_deck.md` after these source changes. The source deck is now truth-aligned; the generated PDF may still contain old text until regenerated.

Recommended command when Marp CLI is available:

```bash
npx @marp-team/marp-cli pitch_deck.md --pdf --allow-local-files -o pitch_deck.pdf
```

## Presenter Guardrails

- Do not say uploaded kernels are executed on MI300X unless a safe harness is actually running.
- Do not say “perfect”, “100%”, or “autonomous repository-wide migration”.
- Do say RadeonShift is a kernel-level CUDA→HIP migration assistant and AMD portability auditor.
- Do emphasize live/cached/demo provenance labels and graceful degradation.
