# Judging Alignment Memo: AMD Developer Hackathon

This document maps the RadeonShift AI features directly to the Judge's grading criteria for Track 3: Unicorn (Judge: Lohith Chiluka).

| Grading Criteria | RadeonShift AI Proof Points |
| :--- | :--- |
| **Creativity** | - **Mixture of Agents (MoA):** Uses two opposing agents (NVIDIA Purist vs AMD Optimizer) rather than a single generic LLM.<br>- **Deterministic + GenAI:** Rejects the "prompt wrapper" trend by combining deterministic regex translation with GenAI architectural review. |
| **Startup Vision** | - **Clear Persona:** Built for "Maya", the Senior ML Engineer blocked by vendor lock-in.<br>- **Hard ROI:** Automated Cost Calculator proving a mathematically sound 5,000x ROI ($146k manual vs $29 automated).<br>- **Enterprise Go-To-Market:** Seamless GitHub Action integration targets enterprise CI/CD pipelines, not just individual developers. |
| **Completeness** | - **Full Stack:** Next.js 16 frontend, FastAPI backend, live MoA API integration.<br>- **UI/UX Polish:** High-end, hardware-themed progressive disclosure UI (collapsed ROI calculator).<br>- **Professionalism:** Complete GitHub repository standards (Contributing, Security, PR Templates). |
| **AMD Infrastructure Doing Real Work** | - **MI300X Focus:** Agent B is explicitly prompted to optimize for AMD Instinct MI300X architecture and Wavefront64 execution.<br>- **ROCm Native:** Emits valid HIP C++ code targeted for ROCm 6.1.<br>- **Hardware Telemetry:** UI surfaces target architecture insights directly during the workflow. |
