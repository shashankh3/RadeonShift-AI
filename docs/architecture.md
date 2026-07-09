# RadeonShift AI Architecture

## Overview
RadeonShift AI is an enterprise-grade DevSecOps pipeline designed to autonomously migrate, peer-review, and optimize legacy NVIDIA CUDA code for AMD MI300X hardware. 

The system relies on a two-phased approach:
1. **Deterministic Translation:** Leveraging AMD's \`hipify-perl\` logic for 100% syntactically accurate baseline translations.
2. **Mixture-of-Agents (MoA) Orchestration:** Utilizing specialized LLM agents to review the deterministic output for hardware-specific optimizations and architectural lock-in risks.

## System Diagram

```ascii
[ User / GitHub PR ] 
        |
        v
+-----------------------+
|  Frontend / Actions   | (Next.js 16 / GitHub Actions)
+-----------------------+
        |
        v
+-----------------------+
|   FastAPI Backend     | (Python, asyncio)
+-----------------------+
        |
        +---> [ Deterministic HIPIFY Pass ]
        |
        +---> [ MoA Orchestration Engine ]
                    |
                    +--> Agent A: NVIDIA Purist (PTX/Warp risks)
                    |
                    +--> Agent B: AMD Optimizer (Wavefront64 tuning)
```

## Frontend (Next.js 16, React 19)
The user interface is a high-performance dashboard styled with TailwindCSS v4. It features a dual-pane editor for source ingress (CUDA) and target workspace (HIP). The UI is deeply integrated with the backend to stream real-time telemetry and Agent scorecard results upon translation completion.

## Backend (FastAPI, Python)
The backend acts as the central orchestrator. It exposes async REST endpoints that handle inbound CUDA code, route it through the deterministic translation logic, and then fire off parallel requests to the MoA engine using the Fireworks AI API.

## Translation Pipeline
RadeonShift AI does not use an LLM for the initial translation. Using an LLM for syntax translation introduces hallucinations and non-deterministic behavior. Instead, we use regex-based \`hipify\` rules to ensure mathematically identical API mappings (e.g., \`cudaMalloc\` -> \`hipMalloc\`), and reserve the LLM strictly for architectural review. **This is our core moat.**

## Mixture of Agents (MoA)
Once the code is translated, two agents review the code in parallel:
- **Agent A (NVIDIA Purist):** Scans for hardcoded warp sizes (32), inline PTX assembly, and vendor lock-in paradigms.
- **Agent B (AMD Optimizer):** Analyzes the code specifically for execution on MI300X architectures, suggesting Wavefront64 optimizations and memory access patterns.

## GitHub Action Workflow
For enterprise integration, RadeonShift AI operates headlessly via a GitHub Action. When a developer opens a PR containing \`.cu\` or \`.cuh\` files, the action triggers the backend, performs the MoA analysis, and posts a detailed markdown scorecard directly onto the PR.

## Deployment Model
The application is designed to be deployed containerized (Docker) on AMD Developer Cloud infrastructure, ensuring the MoA backend and translation engine run closely coupled with target compilation environments.
