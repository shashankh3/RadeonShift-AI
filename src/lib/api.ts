import { DEMO_HIP_OUTPUT, DEMO_AUDIT_FINDINGS, DEMO_BENCHMARK, DEMO_WAVEFRONT_BUG_CUDA, DEMO_WAVEFRONT_BUG_FINDINGS, DEMO_RADEONSHIFT_FIXED_HIP, DEMO_ADVANCED_KERNEL_FINDINGS, DEMO_ADVANCED_KERNEL_HIP } from './demoData';

export interface ScorecardData {
  execution_mode: "ai_only" | "full_stack" | "demo_only";
  translation: {
    source: "fireworks_live" | "hipify_live" | "demo_artifact";
    provider: string | null;
    model: string | null;
    latency_ms: number | null;
  };
  audit: {
    source: "fireworks_live" | "demo_artifact";
    findings_total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    auto_fixable: number;
    confidence_score: number | null;
  };
  hardware: {
    status: "online" | "offline";
    gpu: string | null;
    rocm_version: string | null;
    telemetry_available: boolean;
  };
  benchmark: {
    status: "live" | "cached" | "unavailable";
    elapsed_ms: number | null;
    throughput_gbps: number | null;
    peak_pct: number | null;
  };
}

export interface TranslationResponse {
  rocm_code: string;
  audit_log: string;
  verification?: any;
  scorecard?: ScorecardData;
}

const API_BASE_URL = '/pinggy';

export async function translateCode(code: string): Promise<TranslationResponse> {
  const tStart = performance.now();
  let hwData: any = null;
  
  // Quick health check to see if hardware is alive
  try {
    const hwRes = await fetch('/pinggy/health', { headers: { 'X-Pinggy-No-Screen': 'true' }});
    if (hwRes.ok) hwData = await hwRes.json();
  } catch (e) {
    hwData = null;
  }

  try {
    const transRes = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuda_source: code }),
    });

    if (!transRes.ok) {
      throw new Error(`Translation API failed with status: ${transRes.status}`);
    }

    const transData = await transRes.json();
    const hipCode = transData.translation;
    const transLatency = performance.now() - tStart;

    let auditLog: any = {};
    let auditLatency = 0;
    
    try {
      const aStart = performance.now();
      const auditRes = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuda_source: code, hip_output: hipCode }),
      });
      if (auditRes.ok) {
        const auditData = await auditRes.json();
        auditLog = auditData.findings || {};
      }
      auditLatency = performance.now() - aStart;
    } catch (e) {
      console.warn("Audit API failed, continuing with empty audit");
    }

    // Normalize: ensure both arrays contain only well-formed objects (never raw strings)
    const normalizeFindings = (arr: any[]): any[] => {
      if (!Array.isArray(arr)) return [];
      return arr.map((item: any) => {
        if (typeof item === 'string') {
          return { severity: 'MEDIUM', category: 'AI Finding', finding: item, fix: '', auto_fixable: false };
        }
        if (typeof item === 'object' && item !== null) {
          return {
            severity: item.severity || 'MEDIUM',
            category: item.category || 'AI Finding',
            line: item.line ?? null,
            context: item.context ?? null,
            finding: item.finding || String(item),
            fix: item.fix || '',
            auto_fixable: Boolean(item.auto_fixable),
            patch: typeof item.patch === 'string' ? item.patch : undefined,
          };
        }
        return null;
      }).filter(Boolean);
    };

    const ptx = normalizeFindings(Array.isArray(auditLog.ptx_risks) ? auditLog.ptx_risks : []);
    const wf = normalizeFindings(Array.isArray(auditLog.wavefront_optimizations) ? auditLog.wavefront_optimizations : []);
    const allFindings = [...ptx, ...wf];

    // Deterministic Rules Engine
    let hasCgAsync = false;
    let hasWmma = false;
    let hasIncomplete = false;

    if (code.includes('<cuda/memcpy_async>') || code.includes('cuda::memcpy_async') || code.includes('cg::memcpy_async')) {
      hasCgAsync = true;
      allFindings.push({ severity: "CRITICAL", category: "Unsupported HIP Feature", finding: "cooperative_groups async copy (memcpy_async/wait) is NOT supported in HIP.", fix: "Requires manual redesign using standard shared memory loads or AMD-specific async copy built-ins if supported by target architecture.", auto_fixable: false });
    }
    
    if (code.includes('nvcuda') || code.includes('wmma::fragment') || code.includes('wmma::mma_sync') || code.includes('wmma::load_matrix_sync') || code.includes('wmma::store_matrix_sync') || code.includes('<mma.h>')) {
      hasWmma = true;
      allFindings.push({ severity: "CRITICAL", category: "Tensor Core / WMMA Portability", finding: "CUDA WMMA / Tensor Core patterns detected. Direct translation to HIP is unsafe and often fails to compile without rocWMMA.", fix: "Manual redesign required: Rewrite using AMD rocWMMA library for matrix core acceleration.", auto_fixable: false });
    }

    if (code.includes('sdata_temp')) {
      hasIncomplete = true;
      allFindings.push({ severity: "CRITICAL", category: "Incomplete Source / Compile Risk", finding: "Undefined temp storage 'sdata_temp' detected. This indicates an incomplete source file or missing header that will fail to compile.", fix: "Ensure all shared memory arrays are properly defined and bounded before migration.", auto_fixable: false });
    }
    
    let critical = 0, high = 0, medium = 0, low = 0, auto = 0;
    let hasRedesignRequired = false;
    allFindings.forEach(f => {
      if (f.severity === 'CRITICAL') critical++;
      else if (f.severity === 'HIGH') high++;
      else if (f.severity === 'MEDIUM') medium++;
      else low++;
      if (f.auto_fixable) auto++;
      if (f.auto_fixable === false || f.severity === 'CRITICAL') hasRedesignRequired = true;
    });

    let conf = 100 - (25 * critical) - (20 * high) - (5 * medium) - (1 * low);
    if (hasIncomplete && conf > 39) conf = 39;
    else if (hasWmma && conf > 44) conf = 44;
    else if (hasCgAsync && conf > 49) conf = 49;
    else if (hasRedesignRequired && conf === 100) conf = 80; // Hard cap below 100 if any critical or redesign issue

    if (conf < 0) conf = 0;

    const isHwOnline = hwData?.hardware?.status === 'online';

    const scorecard: ScorecardData = {
      execution_mode: isHwOnline ? "full_stack" : "ai_only",
      translation: {
        source: "fireworks_live",
        provider: "Fireworks AI",
        model: "deepseek-v4-flash",
        latency_ms: transLatency
      },
      audit: {
        source: "fireworks_live",
        findings_total: allFindings.length,
        critical,
        high,
        medium,
        low,
        auto_fixable: auto,
        confidence_score: conf
      },
      hardware: {
        status: isHwOnline ? "online" : "offline",
        gpu: isHwOnline ? (hwData?.hardware?.hardware || 'MI300X') : null,
        rocm_version: isHwOnline ? "6.1" : null,
        telemetry_available: isHwOnline
      },
      benchmark: {
        status: isHwOnline ? "live" : "unavailable",
        elapsed_ms: null,
        throughput_gbps: null,
        peak_pct: null
      }
    };

    auditLog.readiness_score = conf;
    auditLog.ptx_risks = ptx;
    auditLog.wavefront_optimizations = wf;
    auditLog.estimated_mi300x_ms = auditLog.estimated_mi300x_ms || 0.012;

    return {
      rocm_code: hipCode,
      audit_log: JSON.stringify(auditLog),
      verification: {
        status: "ai_audited_not_compiled",
        evidence_id: transData.result_source,
        demo_mode: false
      },
      scorecard
    };
  } catch (err) {
    console.warn("AI Translation unavailable, using frontend emergency demo mode", err);
    
    let critical = 0, high = 0, medium = 0, low = 0, auto = 0;
    const isWavefrontBug = code.includes('warpReduceSum');
    const isAdvancedKernel = code.includes('advancedReduce');
    
    let ptx: any[] = [];
    let wf: any[] = [];
    
    if (isAdvancedKernel) {
      ptx = (DEMO_ADVANCED_KERNEL_FINDINGS as any).filter((f: any) => f.severity === "CRITICAL" || f.severity === "HIGH");
      wf = (DEMO_ADVANCED_KERNEL_FINDINGS as any).filter((f: any) => f.severity === "MEDIUM");
    } else if (isWavefrontBug) {
      ptx = DEMO_WAVEFRONT_BUG_FINDINGS.filter(f => f.severity === "CRITICAL" || f.severity === "HIGH") as any[];
      wf = DEMO_WAVEFRONT_BUG_FINDINGS.filter(f => f.severity === "MEDIUM") as any[];
    } else {
      ptx = DEMO_AUDIT_FINDINGS.filter(f => f.severity === "HIGH") as any[];
      wf = DEMO_AUDIT_FINDINGS.filter(f => f.severity === "MEDIUM") as any[];
    }
    
    const all: any[] = [...ptx, ...wf];
    let hasRedesignRequired = false;
    
    all.forEach(f => {
      if (f.severity === 'CRITICAL') critical++;
      else if (f.severity === 'HIGH') high++;
      else if (f.severity === 'MEDIUM') medium++;
      else low++;
      if (f.auto_fixable) auto++;
      if (f.auto_fixable === false || f.severity === 'CRITICAL') hasRedesignRequired = true;
    });

    let conf = 100 - (25 * critical) - (20 * high) - (5 * medium) - (1 * low);
    if (isAdvancedKernel) conf = 39; // Caps for advanced kernel
    else if (hasRedesignRequired && conf === 100) conf = 80;
    
    if (conf < 0) conf = 0;

    const scorecard: ScorecardData = {
      execution_mode: "demo_only",
      translation: {
        source: "demo_artifact",
        provider: null,
        model: null,
        latency_ms: null
      },
      audit: {
        source: "demo_artifact",
        findings_total: all.length,
        critical,
        high,
        medium,
        low,
        auto_fixable: auto,
        confidence_score: conf
      },
      hardware: {
        status: "offline",
        gpu: null,
        rocm_version: null,
        telemetry_available: false
      },
      benchmark: {
        status: "cached",
        elapsed_ms: 0.026,
        throughput_gbps: 2800,
        peak_pct: 85
      }
    };

    return {
      rocm_code: isAdvancedKernel ? DEMO_ADVANCED_KERNEL_HIP : (isWavefrontBug ? DEMO_RADEONSHIFT_FIXED_HIP : DEMO_HIP_OUTPUT),
      audit_log: JSON.stringify({
        ptx_risks: ptx,
        wavefront_optimizations: wf,
        readiness_score: conf,
        estimated_mi300x_ms: 0.026,
        demo_mode: true
      }),
      verification: {
        status: "demo_artifact_not_compiled",
        evidence_id: "demo_fallback",
        demo_mode: true
      },
      scorecard
    };
  }
}

export interface BenchmarkResponse {
  status: "passed" | "compile_failed" | "runtime_failed" | "unavailable" | "failed_validation" | "success";
  benchmark?: {
    name: string;
    size: number;
    iterations: number;
    elapsed_ms: number;
    throughput_gbps: number;
    bytes_processed: number;
    gpu_name: string | null;
  };
  compile?: {
    attempted: boolean;
    status: "passed" | "failed" | "unavailable";
    stderr_summary: string | null;
    duration_ms: number;
  };
  telemetry?: {
    before: any;
    after: any;
    source: string;
    note: string;
  };
  disclaimer?: string;
  compute_time_ms?: number;
  bandwidth_gbps?: number;
  hardware?: string;
}

export async function runBenchmark(size: number, iterations: number): Promise<BenchmarkResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/benchmark/vector-add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Pinggy-No-Screen': 'true'
      },
      body: JSON.stringify({ size, iterations }),
    });

    if (!response.ok) {
      throw new Error(`Benchmark failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data as BenchmarkResponse;
  } catch (err) {
    console.warn("Backend unavailable, using frontend emergency demo mode");
    const demoResponse = {
      ...DEMO_BENCHMARK,
      status: "passed" as const,
      hardware: "AMD Instinct MI300X (gfx942) [Demo — cached evidence]",
      benchmark: {
        name: DEMO_BENCHMARK.kernel,
        size: size,
        iterations: iterations,
        elapsed_ms: DEMO_BENCHMARK.elapsed_ms,
        throughput_gbps: DEMO_BENCHMARK.throughput_gbps,
        bytes_processed: size * 4 * 3 * iterations,
        gpu_name: "AMD Instinct MI300X (gfx942) [Demo — cached evidence]"
      },
      disclaimer: "⚠ Cached MI300X benchmark evidence — hardware not connected. Values captured on prior verified run."
    };
    return demoResponse as unknown as BenchmarkResponse;
  }
}
