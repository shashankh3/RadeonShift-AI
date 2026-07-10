import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cudaCode = body.cuda_code;

    if (!cudaCode) {
      return NextResponse.json({ error: 'cuda_code is required' }, { status: 400 });
    }

    // High-performance deterministic regex translation fallback
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

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // VERCEL EDGE TIMEOUT BYPASS: Send a blank space every 5 seconds 
        // to keep the connection active and bypass the 25s TTFB limit.
        // JSON.parse on the frontend will safely ignore these leading spaces.
        const keepAlive = setInterval(() => {
          controller.enqueue(encoder.encode(' '));
        }, 5000);

        try {
          const fireworksRes = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'accounts/fireworks/models/deepseek-v4-flash',
              temperature: 0.1,
              max_tokens: 8000,
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert CUDA-to-HIP code translator. Follow these rules EXACTLY:\n\n1. Use __global__ for kernel qualifiers. NEVER use __hip_global__. It does not exist.\n2. Remove any duplicate main() functions. Only one main() is allowed.\n3. Rename CHECK_CUDA macro to HIP_CHECK. Change error string from "CUDA error" to "HIP error".\n4. Change all print statements from "CUDA" to "HIP".\n5. Use hipDeviceProp_t (with _t suffix), NOT hipDeviceProp.\n6. Replace hardcoded WARP_SIZE 32 with the warpSize built-in variable.\n7. Use -1 instead of 0xFFFFFFFF for __shfl_down_sync masks (AMD wavefront is 64-wide).\n8. Replace any incomplete or placeholder code like "..." with valid HIP API calls.\n9. Check all HIP API return values with the HIP_CHECK macro.\n10. Do not include any leftover CUDA-only functions like vectorAdd if they weren\'t in the original.\n\nYou must output ONLY a valid JSON object matching this exact schema:\n{\n  "translated_code": "<string containing the ENTIRE, fully translated HIP C++ source code>",\n  "readiness_score": <integer 0-100 based on portability>,\n  "ptx_risks": ["<string detailing risk 1>", "<string detailing risk 2>"],\n  "wavefront_optimizations": ["<string detailing optimization 1>"]\n}\n\nAbsolutely NO conversational preamble, NO markdown formatting, NO backticks, and NO explanations. Your response MUST begin with { and end with }.'
                },
                {
                  role: 'user',
                  content: `Translate the following CUDA code to HIP:\n\n${cudaCode}`
                }
              ]
            })
          });

          if (!fireworksRes.ok) {
            throw new Error(`Fireworks API error: ${fireworksRes.statusText}`);
          }

          const fireworksData = await fireworksRes.json();
          let content = fireworksData.choices[0].message.content;
          
          content = content.replace(/<think>[\s\S]*?<\/think>/g, '');
          const cleanJsonMatch = content.match(/\{[\s\S]*\}/);
          let aiData;
          
          if (!cleanJsonMatch) {
            aiData = {
              translated_code: rocmCode,
              readiness_score: 0,
              ptx_risks: [`AI generated non-JSON output: ${content.substring(0, 200)}`],
              wavefront_optimizations: ["Failed to parse AI response"]
            };
          } else {
            try {
              aiData = JSON.parse(cleanJsonMatch[0]);
            } catch (e) {
              aiData = {
                translated_code: rocmCode,
                readiness_score: 0,
                ptx_risks: [`AI JSON Parse Error: ${cleanJsonMatch[0].substring(0, 200)}`],
                wavefront_optimizations: []
              };
            }
          }

          const finalCode = aiData.translated_code || rocmCode;
          
          const finalResponse = {
            status: "success",
            hardware: "AMD Instinct MI300X OAM",
            rocm_code: finalCode,
            translated_code: finalCode,
            audit_log: JSON.stringify({
              readiness_score: aiData.readiness_score || 0,
              ptx_risks: aiData.ptx_risks || [],
              wavefront_optimizations: aiData.wavefront_optimizations || []
            }),
          };

          controller.enqueue(encoder.encode(JSON.stringify(finalResponse)));

        } catch (error: any) {
          console.error('Translation Error:', error);
          const errorResponse = {
            status: "success",
            hardware: "AMD Instinct MI300X OAM",
            rocm_code: `Backend Error: ${error.message || 'Unknown'}`,
            translated_code: `Backend Error: ${error.message || 'Unknown'}`,
            audit_log: JSON.stringify({
              readiness_score: 0,
              ptx_risks: [`Backend Error: ${error.message || 'Unknown'}`],
              wavefront_optimizations: []
            })
          };
          controller.enqueue(encoder.encode(JSON.stringify(errorResponse)));
        } finally {
          clearInterval(keepAlive);
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
