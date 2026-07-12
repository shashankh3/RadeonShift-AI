import os
import re

replacements = [
    (r"(?i)deterministic CUDA→HIP translation via AMD's hipify-perl logic \(no LLM hallucination\)", "AI Translation via Fireworks with semantic migration audit"),
    (r"(?i)AI Translation( — LLM-based)?", "AI Translation"),
    (r"(?i)deterministic Mixture of Agents \(MoA\) pipeline", "AI-assisted CUDA kernel migration assistant"),
    (r"(?i)Uses AMD's official `?hipify-perl`? for deterministic API mapping\.?", "Uses Fireworks-hosted translation model for AI Translation."),
    (r"(?i)Orchestrates the AI translation", "Orchestrates the AI translation"),
    (r"(?i)Structured AI Prompts:", "Structured AI Prompts:"),
    (r"(?i)Generated HIP translation", "Generated HIP translation"),
    (r"(?i)Translating CUDA → HIP \(hipify-perl\)", "Translating CUDA → HIP (Fireworks AI)"),
    (r"(?i)MI300X BENCHMARK MODE", "MI300X BENCHMARK MODE"),
    (r"(?i)AI-assisted", "AI-assisted"),
    (r"(?i)AI-generated mapping", "AI-generated mapping"),
    (r"(?i)AI-assisted migration", "AI-assisted migration"),
    (r"(?i)demonstrating generated HIP translation", "demonstrating generated HIP translation"),
    (r"(?i)CUDA kernel migration assistant", "CUDA kernel migration assistant"),
    (r"(?i)CUDA kernel migration assistant", "CUDA kernel migration assistant"),
    (r"(?i)high-quality", "high-quality"),
    (r"(?i)Developer tooling", "Developer tooling"),
    (r"(?i)kernel-level CUDA→AMD migration audit", "kernel-level CUDA→AMD migration audit"),
    (r"(?i)Significant ROI", "Significant ROI"),
    (r"(?i)CUDA to AMD kernel migrations with AI-assisted audits", "CUDA to AMD kernel migrations with AI-assisted audits"),
    (r"(?i)Zero hallucinations\.", ""),
    (r"(?i)We don't trust an LLM to write syntax\. We use deterministic `hipify` rules", "We use AI Translation via Fireworks to assist with syntax"),
    (r"(?i)Fireworks AI handles translation while MoA agents audit", "Fireworks AI handles translation while MoA agents audit"),
    (r"(?i)Rejects the \"prompt wrapper\" trend by combining deterministic regex translation", "Combines AI Translation"),
    (r"(?i)AI-assisted migration path", "AI-assisted migration path"),
    (r"(?i)By utilizing AMD's native hipify-perl layer, we own the mathematical translation logic\.", "By utilizing AI Translation, we assist with initial conversion."),
    (r"(?i)The core translation prompts will be open-sourced", "The core translation prompts will be open-sourced"),
    (r"(?i)\[DETERMINISTIC CONTEXT — High Confidence\]", "[AI Translation CONTEXT]"),
    (r"(?i)Any translation artifacts that need manual correction", "Any translation artifacts that need manual correction"),
    (r"(?i)tool: \"hipify-perl\"", "tool: \"fireworks_live\""),
    (r"(?i)Translated output:", "Translated output:"),
]

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    orig = content
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
        
    if content != orig:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root or '.next' in root:
        continue
    for file in files:
        if file.endswith('.md') or file.endswith('.tsx') or file.endswith('.py') or file.endswith('.ts'):
            process_file(os.path.join(root, file))
