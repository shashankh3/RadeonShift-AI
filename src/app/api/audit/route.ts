import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { cuda_source, hip_output } = await request.json();

    if (!cuda_source || !hip_output) {
      return NextResponse.json({ error: 'cuda_source and hip_output are required' }, { status: 400 });
    }

    const apiKey = process.env.FIREWORKS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error: missing API key' }, { status: 500 });
    }

    const model = process.env.FIREWORKS_MODEL_AUDIT || 'accounts/fireworks/models/deepseek-v4-flash';

    const systemPrompt = `You are a dual-expert CUDA/HIP AI auditor. Your job is to analyze the provided CUDA source code and the translated HIP code, and return JSON containing audit findings.

Specifically look for:
1. Hardcoded warpSize==32 assumptions that fail on AMD's 64-thread wavefronts.
2. NVIDIA-specific inline PTX assembly.
3. Memory coalescing opportunities for MI300X HBM3 architecture.
4. Any leftover CUDA-specific built-ins.

You must output ONLY a valid JSON object matching this exact schema:
{
  "readiness_score": <integer 0-100>,
  "ptx_risks": [
    {
      "severity": "HIGH",
      "category": "Wavefront Correctness",
      "line": 14,
      "context": "int lane = tid % 32;",
      "finding": "Hardcoded warpSize=32 assumption.",
      "fix": "Replace literal 32 with warpSize query",
      "auto_fixable": true,
      "patch": "int lane = tid % warpSize;"
    }
  ],
  "wavefront_optimizations": [
    {
      "severity": "MEDIUM",
      "category": "Memory Coalescing",
      "line": 22,
      "context": "for (int offset = 16; offset > 0; offset >>= 1)",
      "finding": "Reduction offset hardcoded to 16.",
      "fix": "Use warpSize / 2 as initial offset",
      "auto_fixable": true,
      "patch": "for (int offset = warpSize / 2; offset > 0; offset >>= 1)"
    }
  ]
}

Absolutely NO conversational preamble and NO markdown formatting. Return only the JSON object.`;

    const userMessage = `[CUDA SOURCE]\n${cuda_source}\n\n[HIP OUTPUT]\n${hip_output}\n\nReturn the JSON audit findings.`;

    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.1,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    };

    const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json({ error: `Fireworks API failed: ${response.status}`, details: errorData }, { status: response.status });
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content || '{}';
    
    // Clean up potential markdown formatting that the LLM might have leaked
    content = content.replace(/^```(json)?\n/, '').replace(/```\n?$/, '');
    
    let findings;
    try {
      findings = JSON.parse(content);
    } catch (e) {
      findings = {
        readiness_score: 0,
        ptx_risks: ["Failed to parse AI response"],
        wavefront_optimizations: []
      };
    }

    return NextResponse.json({
      findings,
      provider: 'fireworks',
      result_source: 'fireworks_live'
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
