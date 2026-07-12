# Judging Alignment Memo: AMD Developer Hackathon

This document maps the RadeonShift AI features directly to the Judge's grading criteria for Track 3: Unicorn (Judge: Lohith Chiluka).

| Grading Criteria | RadeonShift AI Proof Points |
| :--- | :--- |
| **Creativity** | - **Mixture of Agents (MoA):** Uses two opposing agents (NVIDIA Purist vs AMD Optimizer) rather than a single generic LLM.<br>- **AI Translation + GenAI:** Combines AI Translation with GenAI architectural review. |
| **Startup Vision** | - **Clear Persona:** Built for "Maya", the Senior ML Engineer blocked by vendor lock-in.<br>- **Illustrative ROI:** Cost Calculator shows a transparent first-pass migration/audit savings model ($146k manual review scenario vs low AI-assisted compute cost assumptions).<br>- **Enterprise Go-To-Market:** Optional GitHub Action integration targets enterprise CI/CD pipelines, not just individual developers. |
| **Completeness** | - **Full Stack:** Next.js 16 frontend, FastAPI backend, live MoA API integration.<br>- **UI/UX Polish:** High-end, hardware-themed progressive disclosure UI (collapsed ROI calculator).<br>- **Professionalism:** Complete GitHub repository standards (Contributing, Security, PR Templates). |
| **AMD Infrastructure Doing Real Work** | - **MI300X Focus:** Agent B is explicitly prompted to optimize for AMD Instinct MI300X architecture and Wavefront64 execution.<br>- **ROCm Native:** Emits valid HIP C++ code targeted for ROCm 6.1.<br>- **Hardware Telemetry:** UI surfaces target architecture insights directly during the workflow. |
