# RadeonShift AI: 5-Minute Demo Script

## 0:00 - The Hook & The Problem
*Camera on speaker.*
"Every enterprise right now is trying to get their hands on AMD MI300X hardware. But there's a massive bottleneck: Millions of lines of legacy NVIDIA CUDA code. Manual migration takes months. Simple AI wrappers hallucinate syntax.
I'm [Your Name], and this is **RadeonShift AI** — an enterprise DevSecOps pipeline that migrates CUDA to ROCm with deterministic accuracy and peer-reviews it using a Mixture-of-Agents architecture."

## 1:00 - Source Ingress & Telemetry
*Screen share: TargetWorkspace UI.*
"Here is the RadeonShift dashboard. On the left, we ingest a legacy CUDA kernel. Let's load a standard SGEMM matrix multiplication file. Notice the hardware telemetry—we are specifically targeting the AMD Instinct MI300X and ROCm 6.1. I'll hit 'Migrate to ROCm'."

## 2:00 - The Translation Pipeline
*Click Migrate. Show the loading overlay: HIPIFY -> AGENT A -> AGENT B -> SCORECARD.*
"Under the hood, we don't trust an LLM to write syntax. We use deterministic \`hipify\` rules for a 100% accurate API mapping. 
But translation isn't optimization. That's where our Mixture-of-Agents comes in."

## 3:00 - MoA Scorecard Reveal
*Scorecard renders.*
"Here is the final output. The raw HIP code is generated perfectly. But look at the MoA Audit Scorecard. 
We ran two specialized agents in parallel:
- **Agent A (The NVIDIA Purist)** caught a massive risk: hardcoded warp sizes of 32, which will silently fail on AMD.
- **Agent B (The AMD Optimizer)** took that risk and suggested a direct Wavefront64 memory tuning strategy for the MI300X."

## 4:00 - CI/CD Integration
*Switch to GitHub PR view.*
"But enterprises don't live in dashboards; they live in GitHub. RadeonShift runs entirely headless as a GitHub Action. When a developer opens a PR with a \`.cu\` file, our backend intercepts it and posts this exact scorecard directly in the PR comments."

## 4:30 - The ROI & Business Impact
*Switch back to dashboard. Click 'Expand ROI' on the Cost Calculator.*
"The business impact is undeniable. Manually migrating a 240-kernel repository costs over $140,000 and months of engineering time. RadeonShift AI does it for under $30 in compute. That is a 5,000x ROI, instantly unblocking AMD hardware adoption."

## 4:50 - Closing
*Camera on speaker.*
"This isn't a hackathon toy. This is a v0.1 product. The only thing missing is a Stripe form. Thank you."
