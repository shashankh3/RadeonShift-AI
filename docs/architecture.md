# RadeonShift AI Architecture

## Overview
RadeonShift AI is a CUDA kernel migration assistant designed to translate, peer-review, and audit NVIDIA CUDA code for AMD MI300X / ROCm portability. It assists developers rather than claiming fully autonomous production migration.

The system relies on a three-part approach:
1. **AI Translation:** Leveraging Fireworks AI for semantic initial baseline translations in the primary web flow.
2. **Mixture-of-Agents (MoA) Orchestration:** Utilizing specialized LLM agents to review translated output for hardware-specific optimizations and architectural lock-in risks.
3. **Optional ROCm Evidence:** Using a FastAPI backend via Pinggy for `hipify-perl`, `hipcc` compile checks, trusted benchmark kernels, and `rocm-smi` telemetry when available.

## System Diagram

```ascii
[ User / GitHub PR ] 
        |
        v
+-----------------------+
| Frontend / Optional CI | (Next.js 16 / GitHub Actions)
+-----------------------+
        |
        +---> [ Vercel / Next.js API Layer ] (Fireworks AI via server-side routes)
        |           |
        |           +--> Agent A: NVIDIA Purist (PTX/Warp risks)
        |           |
        |           +--> Agent B: AMD Optimizer (Wavefront64 tuning)
        |
        +---> [ FastAPI Backend (Pinggy Tunnel) ] (Python, bare-metal optional)
                    |
                    +--> [ hipify-perl + hipcc Compile Check ]
                    |
                    +--> [ AMD MI300X Hardware Telemetry ]
```

## Frontend (Next.js 16, React 19)
The user interface is a high-performance dashboard styled with TailwindCSS v4. It features a dual-pane editor for source ingress (CUDA) and target workspace (HIP). The UI is deeply integrated with the backend to stream real-time telemetry and Agent scorecard results upon translation completion.

## Vercel API Layer (Next.js Route Handlers)
The Next.js backend uses server-side API routes to call Fireworks AI for translation and audit. This keeps `FIREWORKS_API_KEY` out of the browser and allows AI-only operation even if bare-metal AMD hardware is offline.

## Hardware Layer (FastAPI, Python)
The FastAPI backend acts as an optional hardware evidence layer. Hosted on an AMD MI300X notebook via Pinggy, it can run `hipify-perl`, perform `hipcc` compile checks, expose live ROCm telemetry, generate reports, and execute trusted benchmark kernels. Uploaded kernels are not automatically executed without a safe harness.

## Translation Pipeline
The primary web pipeline uses Fireworks AI for translation and architectural review. The optional backend also contains a legacy/CI path that can run `hipify-perl` before MoA audit and compile checks.

## Mixture of Agents (MoA)
Once the code is translated, two agents review the code in parallel:
- **Agent A (NVIDIA Purist):** Scans for hardcoded warp sizes (32), inline PTX assembly, and vendor lock-in paradigms.
- **Agent B (AMD Optimizer):** Analyzes the code specifically for execution on MI300X architectures, suggesting Wavefront64 optimizations and memory access patterns.

## GitHub Action Workflow
For optional CI integration, RadeonShift AI includes a GitHub Action. When configured with `RADEONSHIFT_BACKEND_URL`, a PR containing `.cu` or `.cuh` files can trigger a remote backend audit and post a markdown scorecard onto the PR.

## Deployment Model
The frontend can be deployed on Vercel or as a standalone Docker image. The optional FastAPI backend can run near an AMD ROCm environment and be exposed via Pinggy or another secure tunnel.
