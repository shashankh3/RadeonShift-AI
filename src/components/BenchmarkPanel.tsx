'use client';

import React, { useState } from 'react';
import { Activity, Cpu, CheckCircle2, AlertTriangle, Play, AlertCircle } from 'lucide-react';
import { runBenchmark, BenchmarkResponse } from '../lib/api';

export default function BenchmarkPanel() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'unavailable' | 'error'>('idle');
  const [size, setSize] = useState<number>(16777216);
  const [iterations, setIterations] = useState<number>(200);
  const [result, setResult] = useState<BenchmarkResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  
  const handleRun = async () => {
    try {
      setStatus('loading');
      setErrorMsg('');
      const data = await runBenchmark(size, iterations);
      setResult(data);
      if (data.status === 'unavailable') {
        setStatus('unavailable');
      } else if (data.status === 'passed') {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(`Benchmark failed: ${data.status}`);
      }
    } catch (e: any) {
      setStatus('error');
      setErrorMsg('Hardware verification offline in Public Cloud Demo Mode. Deploy to ROCm bare-metal cluster to enable live MI300X benchmarking.');
    }
  };

  return (
    <div className="amd-surface group overflow-hidden border border-amd-red/20 hover:border-amd-red/40 transition-all duration-300 mt-5">
      <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-amd-red/10 blur-3xl" />
      
      <div className="relative z-10 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-amd-red mb-1">
              Live Hardware Test
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-[-0.04em] text-white">
              MI300X Benchmark Mode
            </h3>
            <p className="text-xs font-medium text-white/50 uppercase tracking-widest mt-1">
              Run trusted HIP vector-add on AMD hardware
            </p>
          </div>
          
          <button
            onClick={handleRun}
            disabled={status === 'loading'}
            className="amd-chip-cut flex items-center gap-2 bg-amd-red/90 hover:bg-amd-red text-white px-6 py-2.5 text-sm font-black uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
          >
            {status === 'loading' ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              <Play className="h-4 w-4 fill-white" />
            )}
            {status === 'loading' ? 'Executing...' : 'Run Benchmark'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-black/30 border border-white/10 p-4">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2">
              Vector Size (Elements)
            </label>
            <select 
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              disabled={status === 'loading'}
              className="w-full bg-black border border-white/20 text-white p-2 text-sm focus:border-amd-red outline-none"
            >
              <option value={1048576}>1,048,576 (Small)</option>
              <option value={16777216}>16,777,216 (Default)</option>
              <option value={33554432}>33,554,432 (Large)</option>
            </select>
          </div>
          <div className="bg-black/30 border border-white/10 p-4">
            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2">
              Iterations
            </label>
            <select 
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              disabled={status === 'loading'}
              className="w-full bg-black border border-white/20 text-white p-2 text-sm focus:border-amd-red outline-none"
            >
              <option value={10}>10 (Fast)</option>
              <option value={200}>200 (Default)</option>
              <option value={1000}>1000 (Stress)</option>
            </select>
          </div>
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center p-8 bg-black/40 border border-white/5">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amd-red/30 border-t-amd-red mb-4" />
            <div className="text-xs font-black uppercase tracking-widest text-amd-red animate-pulse">
              Compiling with hipcc & Running on MI300X...
            </div>
          </div>
        )}

        {status === 'unavailable' && (
          <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div className="text-sm font-medium">Benchmark unavailable on this host (hipcc not found).</div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-500">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="text-sm font-medium">{errorMsg}</div>
          </div>
        )}

        {status === 'success' && result && (
          <div className="bg-black/40 border border-emerald-500/30 p-5">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3 mb-6">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-black uppercase tracking-wider">Benchmark Execution Verified</span>
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}
                className="text-[10px] font-black uppercase tracking-wider text-emerald-500 hover:text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 px-2 py-1 transition-colors cursor-pointer"
              >
                Copy Evidence
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <StatBlock label="Elapsed Time" value={result.benchmark.elapsed_ms.toFixed(2)} unit="ms" />
              <StatBlock label="Throughput" value={result.benchmark.throughput_gbps.toFixed(1)} unit="GB/s" />
              <StatBlock label="Elements" value={(result.benchmark.size / 1000000).toFixed(1)} unit="M" />
              <StatBlock label="GPU" value={result.benchmark.gpu_name || 'gfx942'} unit="" />
            </div>

            <div className="mt-4 p-3 bg-white/5 border border-white/10 text-xs text-white/50 italic flex items-start gap-2">
              <Activity className="h-4 w-4 shrink-0 mt-0.5 text-white/40" />
              {result.telemetry.note}
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="text-[10px] font-medium text-white/30 tracking-wide text-center">
            {result?.disclaimer || "Benchmark mode runs a trusted internal HIP kernel, not uploaded source."}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="border border-white/10 bg-black/60 p-3">
      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">{label}</div>
      <div className="text-xl font-black text-white">
        {value} <span className="text-xs text-white/50 ml-1">{unit}</span>
      </div>
    </div>
  );
}
