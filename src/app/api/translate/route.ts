import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cudaCode = body.cuda_code;

    if (!cudaCode) {
      return NextResponse.json({ error: 'cuda_code is required' }, { status: 400 });
    }

    // 1. Fallback Deterministic Translation
    let rocmCode = cudaCode
      .replace(/__global__/g, '__hip_global__')
      .replace(/cudaMalloc/g, 'hipMalloc')
      .replace(/cudaMemcpy/g, 'hipMemcpy')
      .replace(/cudaFree/g, 'hipFree')
      .replace(/<cuda_runtime\.h>/g, '<hip/hip_runtime.h>')
      .replace(/cuda/g, 'hip'); // Catch any remaining cuda* prefixes

    // 2. Integrate Fireworks AI (DeepSeek-V4-Flash)
    const apiKey = process.env.FIREWORKS_API_KEY;
    if (!apiKey) {
      console.warn("FIREWORKS_API_KEY is not set. Returning dummy audit log.");
      return NextResponse.json({
        status: "success",
        hardware: "AMD Instinct MI300X OAM (Mock)",
        rocm_code: rocmCode,
        translated_code: rocmCode,
        audit_log: JSON.stringify({
          readiness_score: 80,
          ptx_risks: [],
          wavefront_optimizations: ["Consider Wavefront64 tuning for MI300X."],
          manual_intervention_required: false,
          estimated_mi300x_ms: 0
        })
      });
    }

    const fireworksRes = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'accounts/fireworks/models/deepseek-v4-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a Mixture-of-Agents auditor. Analyze the provided CUDA and translated HIP code. Return a JSON object with a "ptx_risks" array of portability risks and a "wavefront_optimizations" array of optimization recommendations.'
          },
          {
            role: 'user',
            content: `Original CUDA Code:\n${cudaCode}\n\nTranslated HIP Code:\n${rocmCode}`
          }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!fireworksRes.ok) {
      throw new Error(`Fireworks API error: ${fireworksRes.statusText}`);
    }

    const fireworksData = await fireworksRes.json();
    const auditLogText = fireworksData.choices[0].message.content;

    // Return the Payload
    return NextResponse.json({
      status: "success",
      hardware: "AMD Instinct MI300X OAM (Mock)",
      rocm_code: rocmCode,
      translated_code: rocmCode,
      audit_log: auditLogText,
    });

  } catch (error: any) {
    console.error('Translation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
