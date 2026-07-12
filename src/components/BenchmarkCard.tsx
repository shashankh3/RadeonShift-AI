'use client';

import React from 'react';

interface BenchmarkData {
  kernel: string;
  compile_status: 'SUCCESS' | 'FAILED' | 'UNAVAILABLE';
  elapsed_ms?: number;
  throughput_gbps?: number;
  peak_pct?: number;
  correctness?: string;
  hardware: string;
  timestamp: string;
  cached?: boolean;
  mode: 'live_rocm' | 'fallback';
}

export default function BenchmarkCard({ data }: { data: BenchmarkData }) {
  const isLive = data.mode === 'live_rocm';

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 mt-5">
      {/* Cached warning banner */}
      {data.cached && (
        <div className="bg-yellow-900/40 border border-yellow-700/50 text-yellow-300 text-sm font-medium px-3 py-2 rounded mb-4">
          ⚠️ Cached result — Hardware offline at time of viewing
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">
            MI300X Benchmark
          </div>
          <div className="text-sm font-black uppercase tracking-wide text-white">
            {data.kernel.replace(/_/g, ' ')}
          </div>
        </div>
        <div className={`text-xs font-medium px-2 py-1 rounded ${isLive ? 'text-green-300' : 'text-yellow-300'}`}>
          {isLive ? '🟢 Live MI300X' : '🟡 Fallback Mode'}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Compile status */}
        <div className="bg-gray-950 rounded p-3">
          <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Compile</div>
          <div className={`text-sm font-bold ${data.compile_status === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}`}>
            {data.compile_status === 'SUCCESS' ? '✅ SUCCESS' : data.compile_status === 'UNAVAILABLE' ? '— UNAVAILABLE' : '❌ FAILED'}
          </div>
        </div>

        {/* Execution time */}
        {data.elapsed_ms !== undefined && (
          <div className="bg-gray-950 rounded p-3">
            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Exec Time</div>
            <div className="font-mono text-sm text-white">{data.elapsed_ms.toFixed(3)} ms</div>
          </div>
        )}

        {/* Throughput */}
        {data.throughput_gbps !== undefined && (
          <div className="bg-gray-950 rounded p-3">
            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Throughput</div>
            <div className="font-mono text-sm text-white">{data.throughput_gbps.toFixed(1)} GB/s</div>
          </div>
        )}

        {/* Peak utilization */}
        {data.peak_pct !== undefined && (
          <div className="bg-gray-950 rounded p-3">
            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Peak Utilization</div>
            <div className="font-mono text-sm font-bold text-red-400">{data.peak_pct}% of MI300X peak</div>
          </div>
        )}

        {/* Correctness */}
        {data.correctness && (
          <div className="bg-gray-950 rounded p-3 col-span-2">
            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Correctness</div>
            <div className="text-sm font-bold text-green-400">✅ {data.correctness}</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700/50 pt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{data.hardware}</span>
        <span className="text-xs text-gray-500">{new Date(data.timestamp).toLocaleString()}</span>
      </div>
    </div>
  );
}
