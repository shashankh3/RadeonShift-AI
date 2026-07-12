# RadeonShift AI Demo Flow (60-Second Judging Script)

This is the canonical operator script for hackathon judging. Follow these exact steps to ensure a flawless, truth-aligned presentation that hits the core value proposition instantly.

## 1. Hook (10 seconds)
*Context: Do not overclaim autonomous pipeline capabilities. Focus on the semantic gap.*

> "HIPIFY-style tools can translate CUDA syntax to HIP syntax, but they can't tell you whether your code is still semantically correct on AMD hardware."

## 2. Load the Bug (10 seconds)
**Action:** Click the "HERO DEMO: WAVEFRONT-64 BUG" button in the Source Ingress panel.
**Visual:** Show the CUDA source with `% 32`, `/ 32`, and the reduction loop.

> "Here is a standard CUDA kernel. Notice the hardcoded 32-lane warp assumptions."

## 3. Show the Naive Translation (10 seconds)
**Action:** Click "Migrate to ROCm" and then point at the "Plain Translation" column in the new Comparison panel.

> "This compiles. It looks fine. It is wrong on AMD MI300X."

## 4. Show RadeonShift Catching It (20 seconds)
**Action:** Point at the "RadeonShift Audit" findings column.

> "Our AI audit layer specifically detects this hardware architecture mismatch. It flags the 32-lane assumptions as CRITICAL and provides the exact portable patches using `warpSize`."

## 5. Show the Corrected Output (10 seconds)
**Action:** Point at the "RadeonShift-Corrected HIP" column.

> "This is portable across 32-lane and 64-lane architectures."

## 6. Show Provenance & Hardware Context (10 seconds)
**Action:** Point at the provenance strip and the "Why AMD MI300X Matters" panel.

> "Every artifact here is labeled: live Fireworks translation, live Fireworks audit, and hardware status honestly shown, online or offline. NVIDIA warps are 32 lanes; AMD wavefronts are 64. That mismatch is exactly what we audit for."

*(If hardware is offline)*: "This is intentional degraded operation — translation and audit remain live through Fireworks; hardware evidence is unavailable and labeled as such."

*(If hardware is online)*: "And because our MI300X is online, you can see the live compile-check and telemetry evidence backing this up."

## 7. Close (10 seconds)
> "HIPIFY changes syntax. RadeonShift catches AMD migration bugs."

---

## What Not To Say
- Never say "perfect" or "100%".
- Never say "enterprise-grade" or "autonomous".
- Never claim "runs entirely headless as a GitHub Action".
- Never say "ready for deployment".
- Never claim "executed on MI300X" unless the hardware is actually online.
