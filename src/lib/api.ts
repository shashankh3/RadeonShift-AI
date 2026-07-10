export interface TranslationResponse {
  rocm_code: string;
  audit_log: string;
  verification?: any;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export async function translateCode(code: string): Promise<TranslationResponse> {
  const response = await fetch(`${API_BASE_URL}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cuda_code: code }),
  });

  if (!response.ok) {
    throw new Error(`Translation failed with status: ${response.status}`);
  }

  const data = await response.json();
  
  // Basic validation to ensure the response matches the expected format
  if (!data.rocm_code || !data.audit_log) {
      throw new Error("Invalid response format from server.");
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
    },
    body: JSON.stringify({ size, iterations }),
  });

  if (!response.ok) {
    throw new Error(`Benchmark failed with status: ${response.status}`);
  }

  const data = await response.json();
  return data as BenchmarkResponse;
}
