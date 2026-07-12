import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { cuda_source } = await request.json();

    if (!cuda_source) {
      return NextResponse.json({ error: 'cuda_source is required' }, { status: 400 });
    }

    const apiKey = process.env.FIREWORKS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error: missing API key' }, { status: 500 });
    }

    const model = process.env.FIREWORKS_MODEL_TRANSLATE || 'accounts/fireworks/models/deepseek-v4-flash';

    const systemPrompt = `You are an expert CUDA to AMD HIP conversion tool. 
Your only job is to translate the provided CUDA source code into AMD HIP code.
Apply standard API replacements (e.g., cudaMalloc to hipMalloc, __global__ to __hip_global__, etc).
Do not include markdown blocks, explanation text, or any formatting artifacts. Return ONLY the raw C++ code.`;

    const payload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: cuda_source }
      ],
      temperature: 0.1,
      max_tokens: 4096,
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
    let translation = data.choices[0]?.message?.content || '';
    
    // Clean up potential markdown formatting that the LLM might have leaked
    translation = translation.replace(/^```(cpp|c\+\+|c)\n/, '').replace(/```\n?$/, '');

    return NextResponse.json({
      translation,
      provider: 'fireworks',
      result_source: 'fireworks_live'
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
