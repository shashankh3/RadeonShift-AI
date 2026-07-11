<div align="center">
  <img src="./docs/logo.png" alt="RadeonShift AI Logo" width="300" />
</div>

### 🚀 RadeonShift AI

**Accelerating the MI300X Hardware Migration via Generative AI**

**Live Demo:** [https://radeon-shift-ai.vercel.app/](https://radeon-shift-ai.vercel.app/)

RadeonShift AI is an architecture-aware CUDA migration and audit platform with optional ROCm hardware verification in supported environments. The system uses a specialized Mixture of Agents (MoA) pipeline to translate syntax and provide deep audit guidance for underlying architectural assumptions (like warp sizes and memory models) to target AMD Instinct hardware (e.g., MI300X).

### 🏗️ System Architecture & Tech Stack

The platform is split into a highly responsive web frontend with serverless translation capabilities, and a bare-metal Python backend for live hardware execution.

**1. Frontend Web Application (Next.js Edge)**
* **Framework:** Next.js 14 App Router (React)
* **Styling:** Tailwind CSS with custom glassmorphic "AMD Red" cyber-aesthetics.
* **Core Functionality:** Streams the AI audit directly to the client. Features highly dynamic dashboarding and a built-in ROI calculator modeling manual engineering hours vs. automated compute costs.

**2. The Bare-Metal Hardware Backend (Python & FastAPI)**
While the frontend handles the syntax mapping and AI auditing, the execution environment sits on a Dockerized FastAPI server designed for ROCm-enabled bare-metal instances, tunneled securely to the frontend via Pinggy.
* **MoA AI Orchestrator:** Uses Fireworks AI (DeepSeek V4) to run two parallel agents:
  * **Agent A (NVIDIA Purist):** Flags PTX/lock-in risks.
  * **Agent B (AMD Optimizer):** Suggests MI300X specific tuning (64-lane wavefronts).
* **Trusted Kernel Compilation:** Compiles benchmark kernels on the fly using `hipcc` and executes them directly on the host AMD GPU to validate the compiler toolchain.
* **Hardware Telemetry:** Hooks directly into `rocm-smi` to poll live hardware state (GPU name, VRAM usage) and streams verified compute throughput straight to the dashboard.

### 🛡️ Engineering Highlights

* **Defeating Caching:** We aggressively bypassed Next.js edge caching via `force-dynamic` to ensure hardware telemetry and benchmark results reflect true real-time, bare-metal server states.
* **Secure Cross-Environment Routing:** By tunneling the bare-metal Python backend through Pinggy and proxying requests via Next.js `rewrites()`, the platform entirely bypasses browser-level CORS and Mixed Content restrictions.
* **Transparent Debugging:** The frontend features an advanced error handler that captures raw Python stack traces (like 500 Internal Server Errors) from the remote backend and surfaces them beautifully in the UI for instant troubleshooting.

### ✨ Features
* **CUDA to HIP Translation:** Automated mapping of memory APIs, grid launches, and syntax.
* **Mixture of Agents (MoA) Audit:** Deep analysis for AMD Instinct architecture specifics.
* **Hardware Verification (Bare-metal):** Live ROCm compilation and benchmark execution.

### 🛠️ Setup & Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/shashankh3/RadeonShift-AI
   cd RadeonShift-AI
   ```
2. **Environment Variables:**
   Copy `.env.example` to `.env` and fill in your `FIREWORKS_API_KEY`.
3. **Frontend (Next.js):**
   ```bash
   npm install
   npm run dev
   ```
4. **Backend (FastAPI - Remote Host):**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn api.main:app --host 0.0.0.0 --port 8000
   ```

### 📸 Application Workflow
![Awaiting Migration](./docs/step1.png)
![HIP Optimization Core](./docs/step2.png)
![Architecture Analytics](./docs/step3.png)
![Hardware Telemetry](./docs/step4.png)
![Benchmark Execution](./docs/step5.png)

---
**Created by Shashank Hirwani**
