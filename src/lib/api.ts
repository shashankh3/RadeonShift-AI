export interface TranslationResponse {
  rocm_code: string;
  audit_log: string;
  verification?: any;
}

const API_BASE_URL = '/pinggy';

export async function translateCode(code: string): Promise<TranslationResponse> {
  const response = await fetch(`${API_BASE_URL}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Pinggy-No-Screen': 'true'
    },
    body: JSON.stringify({ cuda_code: code }),
  });

  if (!response.ok) {
    throw new Error(`Translation failed with status: ${response.status}`);
  }

  const data = await response.json();
  
  // Basic validation to ensure the response matches the expected format
  if (!data.rocm_code || (!data.audit_log && !data.tutorial_log)) {
      throw new Error("Invalid response format from server.");
  }

  // Handle older backend payload version
  if (!data.audit_log && data.tutorial_log) {
    data.audit_log = JSON.stringify({
      readiness_score: 100,
      ptx_risks: [],
      wavefront_optimizations: [],
      manual_intervention_required: false,
      estimated_mi300x_ms: 0.0,
      note: data.tutorial_log
    });
  }

  return data as TranslationResponse;
}

export interface BenchmarkResponse {
  status: "passed" | "compile_failed" | "runtime_failed" | "unavailable" | "failed_validation";
  benchmark: {
    name: string;
    size: number;
    iterations: number;
    elapsed_ms: number;
    throughput_gbps: number;
    bytes_processed: number;
    gpu_name: string | null;
  };
  compile: {
    attempted: boolean;
    status: "passed" | "failed" | "unavailable";
    stderr_summary: string | null;
    duration_ms: number;
  };
  telemetry: {
    before: any;
    after: any;
    source: string;
    note: string;
  };
  disclaimer: string;
}

export async function runBenchmark(size: number, iterations: number): Promise<BenchmarkResponse> {
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
}
