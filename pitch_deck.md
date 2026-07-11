---
marp: true
theme: default
class: invert
paginate: true
---

# RadeonShift AI
**Accelerating the MI300X Hardware Migration via Generative AI**

---

## The Problem: CUDA Lock-in
Enterprise AI workloads are facing massive bottlenecks due to a reliance on legacy NVIDIA CUDA codebases. 
- Manually migrating a 50,000-line CUDA codebase to ROCm takes **6+ months** of specialized engineering time. 
- Portability tools exist (e.g. `hipify-perl`), but they lack the architectural awareness to optimize code for AMD Instinct architecture (like 64-wide wavefronts).
- Teams lack visibility into whether their migrated code will actually compile and run on AMD hardware without direct bare-metal access.

---

## The Solution: RadeonShift AI
RadeonShift AI is a deterministic Mixture of Agents (MoA) pipeline that translates CUDA to ROCm instantly and audits the architecture.

1. **Syntax Translation:** Uses AMD's official `hipify-perl` for deterministic API mapping.
2. **MoA Audit:** Leverages DeepSeek-V4 to scan for PTX risks, hardcoded warp sizes, and AMD-specific optimizations.
3. **Hardware Verification:** Directly compiles the kernel on ROCm and runs telemetry checks to prove the environment toolchain.

---

## Architecture

1. **Frontend (Next.js Edge):** Highly responsive UI that streams the AI audit back to the user to bypass serverless timeouts.
2. **AI Layer (Fireworks AI):** MoA pipeline with Agent A (PTX/Lock-in Risk) and Agent B (AMD Instinct Optimizer).
3. **Hardware Backend (FastAPI):** Dockerized Python server running on a ROCm-enabled host. Executes `hipcc` and polls `rocm-smi` for real-time telemetry.

---

## Demo: The RadeonShift Dashboard
![height:350px](./docs/hero.png)

- **Source Code Editor:** Paste raw CUDA C++ kernels.
- **HIP Optimization Core:** View the translated target kernel.
- **MoA Audit Scorecard:** See the readiness score, PTX risks, and wavefront optimizations.
- **Hardware Telemetry:** Live GPU specs, VRAM usage, and Translation Speed metrics.

---

## Business Value & ROI

**The 5,000x ROI Model**
- **Manual Migration:** 244 Kernels × 4 hrs = 976 Engineer-Hours (~$146,000, based on $150/hr senior GPU engineer rate)
- **RadeonShift Migration:** 244 Kernels × 0.12 compute cost = ~$29
- **Time Savings:** Months reduced to minutes.
- **TAM:** $25B+ (Global AI Hardware & Software Services Market)

---

## The AMD Infrastructure Story

- **Hardware Target:** Optimized for AMD Instinct MI300X
- **Software Stack:** Built on ROCm 6.x APIs and `hipcc`
- **AI Acceleration:** MoA pipeline runs on Fireworks AI, which provides AMD Instinct GPU-powered inference
- **Honest Fallbacks:** If the backend lacks ROCm hardware, the platform reports "Hardware Unavailable" without fabricating metrics

---

## Closing & Team

**RadeonShift AI** is bridging the gap between legacy NVIDIA codebases and the future of AMD compute.

- **GitHub Repository:** [Insert Link]
- **Live Demo:** [Insert Link]

**Thank You!**
*(Add your team names or contact info here)*
