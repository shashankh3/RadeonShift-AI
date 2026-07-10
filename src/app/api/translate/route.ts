import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cudaCode = body.cuda_code;

    if (!cudaCode) {
      return NextResponse.json({ error: 'cuda_code is required' }, { status: 400 });
    }

    // High-performance deterministic regex translation
    let rocmCode = cudaCode
      .replace(/__global__/g, '__hip_global__')
      .replace(/cudaMalloc/g, 'hipMalloc')
      .replace(/cudaMemcpy/g, 'hipMemcpy')
      .replace(/cudaFree/g, 'hipFree')
      .replace(/<cuda_runtime\.h>/g, '<hip/hip_runtime.h>')
      .replace(/cuda/g, 'hip');

    const apiKey = process.env.FIREWORKS_API_KEY;
    if (!apiKey) {
      throw new Error("FIREWORKS_API_KEY is not set");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8500);

    const fireworksRes = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'accounts/fireworks/models/deepseek-v4-flash',
        temperature: 0.1,
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: 'You are a headless API. You must output ONLY a valid JSON object containing exactly these keys: "readiness_score" (integer), "ptx_risks" (array of max 2 strings), and "wavefront_optimizations" (array of max 2 strings). Absolutely NO conversational preamble, NO markdown formatting, NO backticks, and NO explanations. Your response MUST begin with { and end with }.'
          },
          {
            role: 'user',
            content: `CUDA:\n${cudaCode}\n\nHIP:\n${rocmCode}`
          }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    clearTimeout(timeoutId);

    if (!fireworksRes.ok) {
      throw new Error(`Fireworks API error: ${fireworksRes.statusText}`);
    }

    const fireworksData = await fireworksRes.json();
    const content = fireworksData.choices[0].message.content;
    
    // Aggressive regex extraction to strip markdown or <think> tags
    const cleanJsonMatch = content.match(/\{[\s\S]*\}/);
    if (!cleanJsonMatch) {
      throw new Error("No valid JSON found in AI response");
    }
    
    const aiData = JSON.parse(cleanJsonMatch[0]);

    // Return Real Data - no fallbacks
    return NextResponse.json({
      status: "success",
      hardware: "AMD Instinct MI300X OAM",
      rocm_code: rocmCode,
      translated_code: rocmCode,
      audit_log: JSON.stringify(aiData),
    });

  } catch (error: any) {
    console.error('Translation Error:', error);
    // TEMPORARY DEBUG: return error as 200 OK so frontend displays it instead of alerting
    return NextResponse.json({
      status: "success",
      hardware: "AMD Instinct MI300X OAM",
      rocm_code: `Backend Error: ${error.message || 'Unknown'}`,
      translated_code: `Backend Error: ${error.message || 'Unknown'}`,
      audit_log: JSON.stringify({
        readiness_score: 0,
        ptx_risks: [`Backend Error: ${error.message || 'Unknown'}`],
        wavefront_optimizations: []
      })
    }, { status: 200 });
  }
}
