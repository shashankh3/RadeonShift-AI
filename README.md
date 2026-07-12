<div align="center">
  <img src="./docs/logo.png" alt="RadeonShift AI Logo" width="300" />
</div>

# RadeonShift AI

**RadeonShift doesn't just translate your CUDA — it catches the bugs that HIPIFY misses, verifies the fix on real AMD MI300X hardware, and delivers a migration report in seconds.**

**Live Demo:** [https://radeon-shift-ai.vercel.app/](https://radeon-shift-ai.vercel.app/)
**GitHub:** [shashankh3/RadeonShift-AI](https://github.com/shashankh3/RadeonShift-AI)

---

## What RadeonShift Does

1. **Translate** — Deterministic CUDA→HIP translation via AMD's hipify-perl
2. **Audit** — Dual-agent AI audit that catches AMD-specific correctness bugs
3. **Verify** — Compile and benchmark on real AMD Instinct MI300X hardware

---

## Why Not Just Use HIPIFY?

| Capability | HIPIFY | RadeonShift |
|---|---|---|
| API renaming | ✅ | ✅ (via hipify-perl) |
| Semantic correctness audit | ❌ | ✅ (MoA dual-agent) |
| Wavefront-64 detection | ❌ | ✅ |
| Compile on AMD hardware | ❌ | ✅ (hipcc on MI300X) |
| Benchmark with telemetry | ❌ | ✅ |
| Migration report | ❌ | ✅ |
| Graceful degradation | ❌ | ✅ |

HIPIFY gives you code that compiles. RadeonShift tells you it compiles wrong — and proves the fix on real hardware.

---

## Architecture

```
Frontend (Next.js) → FastAPI Backend → [hipify-perl | MoA Agents | hipcc + MI300X]
                          ↓
              Pinggy Tunnel → AMD MI300X Hardware
```

### Pipeline Stages
1. **Deterministic Translation** — hipify-perl (high confidence, no LLM)
2. **Static Scanner** — radeonshift_scanner.py detects known bug patterns
3. **Hardware-Aware MoA Audit** — Agent A (NVIDIA Purist) + Agent B (AMD Optimizer) with live MI300X context injection
4. **Hardware Verification** — hipcc compile + benchmark + correctness check
5. **Migration Report** — Combined zip package with source files, audit findings, benchmark results, and human-readable summary

---

## Live Mode vs Fallback Mode

| Mode | Features Available | Trigger |
|---|---|---|
| 🟢 Live MI300X | Translation + Audit + Compile + Benchmark + Telemetry | Hardware connected |
| 🟡 Audit-Only | Translation + Audit only | Hardware offline |

The system automatically detects hardware availability and degrades gracefully. Audit findings remain valid in both modes.

---

## Demo Mode

For demo environments without LLM access, set `USE_MOCK_AI=true` in the backend environment. This returns predefined audit findings without calling any LLM, allowing the full UI to be demonstrated without API credits or network dependencies.

| Environment Variable | Description |
|---|---|
| `USE_MOCK_AI` | Set to `true` to use predefined audit findings instead of LLM calls |

---

## Emergency Demo Mode

If the remote AMD notebook or tunnel is unavailable, RadeonShift automatically falls back to a frontend-only emergency demo mode. This preserves the full UX with preloaded translation, audit, diff, benchmark, and report artifacts so the product remains demonstrable under infrastructure failure.

---

## Always-On AI Translation Layer

RadeonShift uses a Vercel-hosted server-side API route for Fireworks-powered translation, so CUDA→HIP translation remains available even if the remote AMD notebook is offline.

- **Fireworks AI** handles translation and audit via Vercel Edge/Serverless functions.
- **AMD MI300X notebook** handles optional compile, benchmark, and ROCm telemetry.
- This separation keeps the core migration workflow live while allowing hardware verification to reconnect independently.

### Environment Variables

RadeonShift requires the following server-side environment variables configured in your Vercel project (these should never be exposed to the client):

```
FIREWORKS_API_KEY=<server-side secret stored in Vercel>
FIREWORKS_MODEL_TRANSLATE=accounts/fireworks/models/deepseek-v4-flash
FIREWORKS_MODEL_AUDIT=accounts/fireworks/models/deepseek-v4-flash
```

---

## Reconnectable Hardware Layer

RadeonShift separates AI audit availability from AMD hardware availability.

- **Fireworks AI** provides the always-on audit layer.
- **AMD MI300X + Pinggy** provide the optional hardware execution layer for compilation, telemetry, and benchmarking.

When live AMD hardware is unavailable, RadeonShift can display cached benchmark evidence captured from prior verified MI300X runs. These values are labeled explicitly and are not presented as live execution results.

If the notebook disconnects, RadeonShift continues in **AI-Only Mode**. When the notebook reconnects, the hardware layer becomes available again without changing the core audit workflow.

## Truthful Scorecard Policy

RadeonShift only displays metrics that are computed from the current execution mode.

- In **AI-only mode**, translation and MoA audit remain live through Fireworks AI, while hardware-only fields are marked unavailable.
- In **full-stack mode**, the scorecard includes both live AI-derived metrics and live AMD hardware verification data.
- Cached benchmark evidence, when shown, is explicitly labeled and never presented as live execution.

### Pinggy Tunnel Reliability

For long-running tunnels, Pinggy supports auto-reconnecting tunnel scripts, and persistent subdomains are available with Pinggy Pro. A persistent subdomain keeps the public backend URL stable across notebook restarts.

---

## Current Scope (v1.0)

**What RadeonShift validates:**
- ✅ Semantic correctness (audit agents catch wavefront-64, PTX, shuffle mask bugs)
- ✅ Translation completeness (hipify-perl + scanner)
- ✅ Compilation (hipcc on MI300X — when hardware available)
- ✅ Runtime correctness (benchmark with checksum verification — when hardware available)
- ✅ Performance telemetry (throughput, % of peak — when hardware available)

**What is explicitly roadmap:**
- Repository-level migration (multi-file projects)
- Automated patch application (currently suggests patches, manual apply)
- Multi-architecture targeting (currently gfx942 only)

---

## Bug Patterns Detected

See [BUG_PATTERNS.md](BUG_PATTERNS.md) for the full taxonomy.

## Evaluation Plan

See [EVAL_PLAN.md](EVAL_PLAN.md) for the evaluation methodology.

---

## 📸 Application Workflow

![Awaiting Migration](./docs/step1.png)
![HIP Optimization Core](./docs/step2.png)
![Architecture Analytics](./docs/step3.png)
![Hardware Telemetry](./docs/step4.png)
![Benchmark Execution](./docs/step5.png)

---

## Setup & Installation

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
4. **Backend (FastAPI — Remote Host):**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn api.main:app --host 0.0.0.0 --port 8000
   ```

## Docker

```bash
docker build -t radeonshift .
docker-compose up
```

---

## Roadmap

- Repository-level migration (GitHub URL or ZIP upload)
- Fine-tuned AMD-specific code model
- Multi-kernel batch migration

---

## Built For

AMD Developer Hackathon ACT II — Unicorn Track

---

**Created by Shashank Hirwani**
