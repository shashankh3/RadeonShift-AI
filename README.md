### 🚀 RadeonShift AI: Project Overview

RadeonShift AI is an architecture-aware CUDA migration and audit platform with optional ROCm hardware verification in supported environments. The system uses a specialized Mixture of Agents (MoA) pipeline to translate syntax and provide deep audit guidance for underlying architectural assumptions (like warp sizes and memory models) to target AMD Instinct hardware (e.g., MI300X).

### 🏗️ System Architecture & Tech Stack

The platform is split into a highly responsive web frontend with serverless translation capabilities, and a bare-metal Python backend for live hardware execution.

**1. Frontend Web Application**

* **Framework:** Next.js 14 App Router (React)
* **Styling:** Tailwind CSS with custom glassmorphic "AMD Red" cyber-aesthetics.
* **Core Components:**
  * **SourceEditor.tsx:** The input staging area where engineers paste raw CUDA C++ kernels.
  * **TargetWorkspace.tsx:** The central dashboard containing translated HIP C++ source, an MoA audit scorecard detailing readiness and wavefront optimizations, and hardware telemetry.
  * **CostCalculator.tsx:** A dynamic business-impact module calculating ROI by comparing manual engineering hours vs. automated AI compute time.

**2. The Edge Translation Engine (Next.js & Serverless AI)**
The core translation pipeline runs on the Vercel Edge network, using a specialized Mixture of Agents (MoA) powered by DeepSeek-V4-Flash (via Fireworks AI).

* **Strict Prompt Engineering:** The LLM is bound by exactly 11 immutable rules, forcing it to dynamically handle AMD’s 64-wide wavefronts, replace NVIDIA-specific intrinsics, map `HIP_SYMBOL`, and strip unused allocations.
* **The Serverless Timeout Bypass:** Deep AI reasoning takes time. To bypass strict serverless execution limits, the route utilizes a custom `ReadableStream` proxy. It begins the streamed response within the 25-second Edge runtime window so long-running translation responses remain deliverable.

**3. The Bare-Metal Hardware Backend (Python & FastAPI)**
While the frontend handles the syntax mapping and AI auditing, the execution environment sits on a Dockerized FastAPI server designed for ROCm-enabled bare-metal instances.

* **Trusted Kernel Compilation:** The platform takes a trusted, standardized vector-add benchmark, compiles it on the fly using `hipcc`, and executes it on the host AMD GPU via a subprocess to validate the compiler toolchain.
* **Hardware Telemetry:** It hooks directly into `rocm-smi` to poll live hardware state (GPU name, VRAM usage) and returns the verified compute throughput (GB/s) straight to the Next.js dashboard in a clean JSON payload.

### 🛡️ Deterministic Degradation & Fallbacks

* **Environment-Aware Fallback:** If deployed on a host without ROCm tooling or AMD GPU access, the backend transparently reports hardware verification as unavailable while keeping all frontend translation and AI audit flows fully operational.
* **Compatibility Fallback:** If the primary AI translation path fails or hallucinates, the system falls back to a lightweight heuristic syntax conversion path. This ensures the application remains responsive without fabricating hardware validation, injecting the raw LLM output into an audit log for manual engineering review.
