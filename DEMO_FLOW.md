# Recommended Judge Demo Flow

This script is designed for live presentations to hackathon judges. It ensures you highlight the real technical achievements without accidentally claiming features that are currently mocked or offline.

## Setup
Before the demo, decide whether your hardware notebook (Pinggy) is **ONLINE** or **OFFLINE**. 

### If ONLINE (Full-Stack Mode)
1. Start the FastAPI backend and Pinggy tunnel on the AMD MI300X instance.
2. Refresh the Vercel frontend.
3. Wait for the `ModeBanner` to show **🟢 Full Stack Online**.

### If OFFLINE (AI-Only Mode)
1. Leave the notebook off.
2. Refresh the Vercel frontend.
3. Wait for the `ModeBanner` to show **🟡 AI-Only Mode**.

---

## 1. The Introduction (1 min)
**Action:** Show the "Awaiting Migration" screen.
**Talk Track:**
"This is RadeonShift AI, an AI-assisted CUDA kernel migration assistant. We help teams move away from NVIDIA lock-in by catching the AMD-specific architectural bugs that simple syntax translators miss. Today, we're operating in [Full Stack / AI-Only] mode."

> **⚠️ DO NOT SAY:** "Fully autonomous enterprise repo migration" or "Deterministic hipify-perl translation."

## 2. The Translation (1 min)
**Action:** Paste a CUDA kernel (e.g., one with a hardcoded warp size of 32) and click **Migrate to ROCm**.
**Talk Track:**
"Under the hood, we use Fireworks AI for the initial mapping and a dual-agent MoA architecture for semantic review. It translates the syntax and immediately audits the generated HIP code for architectural risks, like hardcoded warp sizes that fail on AMD's 64-lane wavefronts."

## 3. The Audit Scorecard (1 min)
**Action:** Switch to the **Architecture Analytics** tab. Show the findings.
**Talk Track:**
"Here is the MoA Audit Scorecard. These findings are generated live by Fireworks AI based on the translated kernel. You can see it caught the warp-size issue. The confidence score is dynamically computed from these actual findings—no hardcoded metrics."

## 4. The Hardware Verification (1 min)

**If ONLINE:**
**Action:** Switch to **Hardware Telemetry**. Click **Run Benchmark**.
**Talk Track:**
"Because we're in Full-Stack mode, we can now send this kernel to a real remote AMD MI300X instance. It compiles it bare-metal, verifies it, and streams back live execution telemetry and benchmark data."

**If OFFLINE:**
**Action:** Switch to **Hardware Telemetry**. Show the cached benchmark evidence.
**Talk Track:**
"Because our AMD notebook is currently offline, RadeonShift gracefully degrades. It shows cached benchmark evidence from a prior verified MI300X run to demonstrate the platform capabilities, explicitly labeled so there is no confusion with live data."

> **⚠️ DO NOT SAY:** "Execution verified" if offline. Explicitly point out the "Cached evidence" label to earn trust points for transparency.

## 5. The Report (30 sec)
**Action:** Click **Download Migration Report (.zip)**. Open the generated file.
**Talk Track:**
"Finally, we generate a comprehensive migration report containing the source files and the MoA audit payload. Notice the provenance labels—every action is explicitly tracked, ensuring full auditability of the AI and hardware layers."
