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
  const isCached = data.cached || data.mode === 'fallback' || data.mode === 'ai_only' as string;
  const isUnavailable = data.compile_status === 'UNAVAILABLE' || (!data.elapsed_ms && !data.throughput_gbps);
  const isLive = !isCached && !isUnavailable && data.mode === 'live_rocm';

  let headerText = '';
  let footerText = '';
  let headerIcon = '';
  let sourceText = '';

  if (isUnavailable) {
    headerText = 'Benchmark unavailable';
    footerText = 'No live hardware benchmark is available for this session.';
    headerIcon = '❌';
    sourceText = '';
  } else if (isLive) {
    headerText = 'Live Benchmark Execution Verified';
    footerText = 'Benchmark executed successfully on connected AMD hardware.';
    headerIcon = '✅';
    sourceText = 'Source: live hardware';
  } else {
    headerText = 'Cached MI300X Benchmark Evidence';
    footerText = 'Benchmark values shown are from a prior verified AMD MI300X run. Live hardware is currently unavailable.';
    headerIcon = '⚠';
    sourceText = 'Source: cached evidence';
  }

  return (
    <div className={`bg-gray-900 border ${isLive ? 'border-emerald-700/50' : isUnavailable ? 'border-gray-700' : 'border-yellow-700/50'} rounded-lg p-5 mt-5 relative`}>
      {/* Source label */}
      {sourceText && (
        <div className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest text-white/30 bg-white/5 px-2 py-1 rounded-sm border border-white/10">
          {sourceText}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pr-32">
        <div className="text-xl">{headerIcon}</div>
        <div>
          <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">
            MI300X Benchmark
          </div>
          <div className={`text-sm font-black uppercase tracking-wide ${isLive ? 'text-emerald-400' : isUnavailable ? 'text-gray-400' : 'text-yellow-400'}`}>
            {headerText}
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      {!isUnavailable && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-950 rounded p-3">
            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Compile</div>
            <div className={`text-sm font-bold ${data.compile_status === 'SUCCESS' ? 'text-green-400' : 'text-red-400'}`}>
              {data.compile_status === 'SUCCESS' ? '✅ SUCCESS' : '❌ FAILED'}
            </div>
          </div>

          {data.elapsed_ms !== undefined && (
            <div className="bg-gray-950 rounded p-3">
              <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Exec Time</div>
              <div className="font-mono text-sm text-white">{data.elapsed_ms.toFixed(3)} ms</div>
            </div>
          )}

          {data.throughput_gbps !== undefined && (
            <div className="bg-gray-950 rounded p-3">
              <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Throughput</div>
              <div className="font-mono text-sm text-white">{data.throughput_gbps.toFixed(1)} GB/s</div>
            </div>
          )}

          {data.peak_pct !== undefined && (
            <div className="bg-gray-950 rounded p-3">
              <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Peak Utilization</div>
              <div className="font-mono text-sm font-bold text-red-400">{data.peak_pct}% of MI300X peak</div>
            </div>
          )}

          {data.correctness && (
            <div className="bg-gray-950 rounded p-3 col-span-2">
              <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Correctness</div>
              <div className="text-sm font-bold text-green-400">✅ {data.correctness}</div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-700/50 pt-3 flex flex-col gap-2">
        <div className="text-xs text-gray-400 italic">
          {footerText}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider">
            {isCached ? 'AMD Instinct MI300X (gfx942)' : (data.hardware || 'Unavailable')} 
            {isCached && ' * Captured on prior run'}
          </span>
          <span className="text-[10px] text-gray-500">{new Date(data.timestamp).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
