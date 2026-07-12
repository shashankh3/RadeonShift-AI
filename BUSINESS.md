# RadeonShift AI — Business Strategy

## The Persona (Real User, Real Pain)

Maya is a Senior ML Engineer at a fintech firm. Her team has 340,000 lines of CUDA code and an active AMD MI300X cluster they cannot utilize due to vendor lock-in. Every month they pay for idle AMD hardware while continuing to lease NVIDIA H100s at premium rates. RadeonShift turns her 18-month manual migration project into a 3-week automated sprint.

## The Economics That Pencil Out

| Approach | Migration Time (100 kernels) | Accuracy | Cost | Human Review Required |
|---|---|---|---|---|
| Manual rewrite | ~400 hours | High | $60,000 | 100% |
| ChatGPT / generic LLM | ~2 hours | Low (hallucination risk) | ~$5 | 80%+ |
| AMD hipify-perl (raw) | ~5 minutes | High (syntax only) | ~$0 | 40% (no optimization) |
| **RadeonShift** | **~8 minutes** | **High (AI Translation + Audit)** | **~$12** | **<10%** |

- **Legacy Cost:** A 100-kernel migration done manually requires approximately 400 engineer-hours at $150/hr, totaling $60,000.
- **RadeonShift Cost:** The identical batch migration costs approximately $12 in Fireworks AI API tokens and AMD Developer Cloud compute.
- **ROI: Significant ROI**

## The Defensible Edge

Our moat is rooted in AI Translation. By utilizing AI Translation, we assist with initial conversion. RadeonShift is a compiler-adjacent pipeline with an AI orchestration layer on top, not just a thin prompt wrapper.

## Why Now

The post-H100 supply crunch has pushed enterprises toward AMD MI300X clusters, but the CUDA migration barrier remains the #1 adoption blocker. AMD's ROCm 6.2 release reached feature parity with CUDA in Q1 2026, but the tooling layer to automate migration doesn't exist. RadeonShift fills that gap at the exact moment enterprises are reallocating compute budgets away from NVIDIA premiums.

## Market Sizing (TAM/SAM/SOM)

- **TAM:** $4.2B — Global GPU migration and porting services market as enterprises shift from NVIDIA to AMD
- **SAM:** $640M — Developer tooling for GPU code migration (targeting companies with >10K lines of CUDA)
- **SOM:** $12M — Year 1-2 capture from AMD ISV partners and enterprise early adopters transitioning to MI300X

## Open-Source Flywheel Strategy

The core translation prompts will be open-sourced under Apache 2.0. The MoA orchestration layer and Compilation Readiness scoring remain proprietary. This creates a community contribution flywheel — AMD ecosystem developers improve the translation rules, while enterprise customers pay for the kernel-level CUDA→AMD migration audit, CI/CD integration, and SLA-backed support.

## Business Model: Migration-as-a-Service

- **Self-serve (CLI + GitHub Action):** $0.04/kernel translated, pay-as-you-go via API
- **Enterprise (Managed pipeline + SLA):** $50K/year per org, includes CI/CD integration, audit trails, and dedicated support
- **Professional services:** Custom migration engagements for codebases >500K lines
