# RadeonShift AI: 5-Minute Demo Script

## 0:00 - The Hook & The Problem
*Camera on speaker.*
"Enterprises adopting AMD MI300X hardware still face a major blocker: legacy NVIDIA CUDA kernels. Syntax translators can rename APIs, but they do not prove the code is semantically safe on AMD's 64-lane wavefront architecture.
I'm [Your Name], and this is **RadeonShift AI** — a CUDA kernel migration assistant that translates CUDA to HIP/ROCm with AI assistance and peer-reviews architectural risks using a Mixture-of-Agents workflow."

## 1:00 - Source Ingress & Telemetry
*Screen share: TargetWorkspace UI.*
"Here is the RadeonShift dashboard. On the left, we ingest a legacy CUDA kernel. Let's load the wavefront bug demo. Notice the system labels whether we are in full-stack, AI-only, or demo mode. I'll hit 'Migrate to ROCm'."

## 2:00 - The Translation Pipeline
*Click Migrate. Show the loading overlay: HIPIFY -> AGENT A -> AGENT B -> SCORECARD.*
"Under the hood, we use Fireworks AI for the initial mapping and dual-agent architecture for semantic review. 
But translation isn't optimization. That's where our Mixture-of-Agents comes in."

## 3:00 - MoA Scorecard Reveal
*Scorecard renders.*
"Here is the final output. The generated HIP code is shown alongside provenance and audit findings. Look at the MoA Audit Scorecard.
We ran two specialized agents in parallel:
- **Agent A (The NVIDIA Purist)** caught a massive risk: hardcoded warp sizes of 32, which will silently fail on AMD.
- **Agent B (The AMD Optimizer)** took that risk and suggested a direct Wavefront64 memory tuning strategy for the MI300X."

## 4:00 - CI/CD Integration
*Optional: switch to GitHub PR view if the workflow is configured.*
"For CI, RadeonShift includes a GitHub Action. When a repository configures a remote backend URL, PRs touching `.cu` or `.cuh` files can receive a migration audit comment. This is optional and depends on the backend being available."

## 4:30 - The Illustrative First-Pass ROI
*Switch back to dashboard. Click 'Expand ROI' on the Cost Calculator.*
"The illustrative first-pass ROI is the audit and translation time saved. Our illustrative ROI model compares hundreds of hours of manual first-pass review with minutes of AI-assisted triage, while still keeping human validation in the loop for production."

## 4:50 - Closing
*Camera on speaker.*
"HIPIFY changes syntax. RadeonShift catches AMD migration bugs and labels every artifact as live, cached, unavailable, or demo. Thank you."
