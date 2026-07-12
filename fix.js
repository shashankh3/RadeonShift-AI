const fs = require('fs');
const path = require('path');

const replacements = [
  [/deterministic CUDA→HIP translation via AMD's `?hipify-perl`? logic \(no LLM hallucination\)/gi, 'AI translation via Fireworks with semantic migration audit'],
  [/Deterministic Translation/gi, 'AI Translation'],
  [/deterministic Mixture of Agents \(MoA\) pipeline/gi, 'AI-assisted CUDA kernel migration assistant'],
  [/Uses AMD's official `?hipify-perl`? for deterministic API mapping\.?/gi, 'Uses Fireworks-hosted translation model for AI translation.'],
  [/Orchestrates the deterministic translation/gi, 'Orchestrates the AI translation'],
  [/Deterministic AI Prompts:/gi, 'Structured AI Prompts:'],
  [/Raw hipify-perl output/gi, 'Generated HIP translation'],
  [/Translating CUDA → HIP \(hipify-perl\)/gi, 'Translating CUDA → HIP (Fireworks AI)'],
  [/COMPILE VERIFIED/gi, 'MI300X BENCHMARK MODE'],
  [/100% syntactically accurate/gi, 'AI-assisted'],
  [/100% accurate API mapping/gi, 'AI-generated mapping'],
  [/100% deterministic compilation/gi, 'AI-assisted migration'],
  [/demonstrating 100% successful translation/gi, 'demonstrating generated HIP translation'],
  [/enterprise-grade DevSecOps pipeline/gi, 'CUDA kernel migration assistant'],
  [/enterprise DevSecOps pipeline/gi, 'CUDA kernel migration assistant'],
  [/enterprise-grade, startup-quality/gi, 'high-quality'],
  [/Enterprise DevSecOps tooling/gi, 'Developer tooling'],
  [/managed DevSecOps pipeline/gi, 'kernel-level CUDA→AMD migration audit'],
  [/5,000x ROI/gi, 'Significant ROI'],
  [/months of migration overhead into a seamless, automated workflow/gi, 'CUDA to AMD kernel migrations with AI-assisted audits'],
  [/Zero hallucinations\./gi, ''],
  [/We don't trust an LLM to write syntax\. We use deterministic `hipify` rules/gi, 'We use AI translation via Fireworks to assist with syntax'],
  [/LLMs are never used to blindly rewrite syntax/gi, 'Fireworks AI handles translation while MoA agents audit'],
  [/Rejects the "prompt wrapper" trend by combining deterministic regex translation/gi, 'Combines AI translation'],
  [/fastest, most deterministic migration path/gi, 'AI-assisted migration path'],
  [/By utilizing AMD's native hipify-perl layer, we own the mathematical translation logic\./gi, 'By utilizing AI translation, we assist with initial conversion.'],
  [/The deterministic hipify translation layer will be open-sourced/gi, 'The core translation prompts will be open-sourced'],
  [/\[DETERMINISTIC CONTEXT — High Confidence\]/gi, '[AI TRANSLATION CONTEXT]'],
  [/Any translation artifacts from hipify-perl that need manual correction/gi, 'Any translation artifacts that need manual correction'],
  [/tool: "hipify-perl"/gi, 'tool: "fireworks_live"'],
  [/hipify-perl output:/gi, 'Translated output:'],
  [/DevSecOps/gi, 'migration tool'],
  [/✅ \(via hipify-perl\)/gi, '✅ (via AI translation)'],
  [/Leveraging AMD's `hipify-perl` logic for AI-assisted baseline translations\./gi, 'Leveraging AI translation for baseline mapping.'],
  [/review the deterministic output/gi, 'review the AI translated output'],
  [/Deterministic HIPIFY Pass & Compile/gi, 'AI HIPIFY Pass & Compile'],
  [/RadeonShift AI does not use an LLM for the initial translation\..*?This is our core moat\./gis, 'RadeonShift AI uses Fireworks AI for translation and architectural review.'],
  [/deterministic accuracy/gi, 'AI assistance'],
  [/We use deterministic `hipify` rules for a AI-generated mapping\./gi, 'We use AI translation for the initial mapping.'],
  [/Deterministic \+ GenAI:/gi, 'AI Translation + GenAI:'],
  [/deterministic power of `hipify-perl`/gi, 'AI translation capabilities'],
  [/Translating CUDA → HIP \(hipify-perl\)\.\.\./gi, 'Translating CUDA → HIP (Fireworks AI)...'],
  [/High \(deterministic \+ AI\)/gi, 'High (AI Translation + Audit)'],
  [/Translating CUDA \\u2192 HIP \(hipify-perl\)/gi, 'Translating CUDA \\u2192 HIP (Fireworks AI)']
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fullPath.includes('.git') || fullPath.includes('node_modules') || fullPath.includes('.next')) continue;
    
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (['.md', '.tsx', '.ts', '.py'].some(ext => fullPath.endsWith(ext))) {
      const orig = fs.readFileSync(fullPath, 'utf8');
      let content = orig;
      for (const [regex, repl] of replacements) {
        content = content.replace(regex, repl);
      }
      if (orig !== content) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated ' + fullPath);
      }
    }
  }
}

processDirectory('.');
