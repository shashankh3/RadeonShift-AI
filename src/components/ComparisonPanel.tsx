import React from 'react';
import { AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { DEMO_NAIVE_TRANSLATION_HIP, DEMO_RADEONSHIFT_FIXED_HIP } from '../lib/demoData';

interface ComparisonPanelProps {
  findings: any[];
}

export default function ComparisonPanel({ findings }: ComparisonPanelProps) {
  return (
    <div className="flex flex-col gap-4 mt-6">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.32em] text-white/45">
        <span className="h-px w-8 bg-amd-red shadow-[0_0_12px_rgba(237,28,36,0.95)]" />
        Competitive Differentiation
      </div>
      <h2 className="text-xl font-black uppercase italic tracking-[-0.06em] text-white">
        Plain Translation vs <span className="text-amd-red">RadeonShift</span>
      </h2>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Column 1: Plain / Naive Translation */}
        <div className="flex flex-col border border-white/10 bg-black/40">
          <div className="border-b border-white/10 bg-black/60 p-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">PLAIN SYNTAX TRANSLATION</h3>
            <p className="text-[10px] uppercase tracking-wider text-white/40">API renamed, semantics unchanged</p>
          </div>
          <div className="flex-1 overflow-auto bg-[#030305]/80 p-4 text-xs font-mono text-white/70">
            <pre><code>{DEMO_NAIVE_TRANSLATION_HIP}</code></pre>
          </div>
          <div className="flex items-center gap-2 border-t border-white/10 bg-red-500/10 p-3">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-[10px] font-black uppercase tracking-wider text-red-500">⚠ Compiles but semantically unsafe on AMD wavefront-64</span>
          </div>
        </div>

        {/* Column 2: RadeonShift Audit Findings */}
        <div className="flex flex-col border border-white/10 bg-black/40">
          <div className="border-b border-white/10 bg-black/60 p-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">RADEONSHIFT AUDIT</h3>
            <p className="text-[10px] uppercase tracking-wider text-white/40">AMD-specific semantic risk detection</p>
          </div>
          <div className="flex-1 flex flex-col gap-2 overflow-auto bg-[#030305]/80 p-4">
            {findings.map((f, i) => (
              <div key={i} className="border border-white/5 bg-white/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 ${
                    f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    f.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {f.severity}
                  </span>
                  <span className="text-[10px] text-white/40">LINE {f.line}</span>
                </div>
                <p className="text-xs text-white/90 mb-2 leading-relaxed">{f.finding}</p>
                {f.patch && (
                  <div className="mt-2 bg-black/50 p-2 border border-emerald-500/20">
                    <span className="text-[9px] text-emerald-500/60 font-black uppercase block mb-1">Suggested Patch</span>
                    <code className="text-[11px] font-mono text-emerald-400">{f.patch}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: RadeonShift-Corrected Output */}
        <div className="flex flex-col border border-white/10 bg-black/40">
          <div className="border-b border-white/10 bg-black/60 p-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">RADEONSHIFT-CORRECTED HIP</h3>
            <p className="text-[10px] uppercase tracking-wider text-white/40">Wavefront-64 safe</p>
          </div>
          <div className="flex-1 overflow-auto bg-[#030305]/80 p-4 text-xs font-mono text-emerald-400/90">
            <pre><code>{DEMO_RADEONSHIFT_FIXED_HIP}</code></pre>
          </div>
          <div className="flex items-center gap-2 border-t border-white/10 bg-emerald-500/10 p-3">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">✓ Portable across 32-lane and 64-lane architectures</span>
          </div>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-black/60 border-b border-white/10">
              <th className="p-3 font-black uppercase tracking-wider text-white/60">Plain Translation</th>
              <th className="p-3 font-black uppercase tracking-wider text-amd-red">RadeonShift</th>
            </tr>
          </thead>
          <tbody className="bg-black/30">
            <tr className="border-b border-white/5">
              <td className="p-3 text-white/70">Renames CUDA APIs to HIP APIs</td>
              <td className="p-3 text-emerald-400/90">Renames APIs AND audits semantic correctness</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="p-3 text-white/70">Preserves hardcoded 32-lane assumptions</td>
              <td className="p-3 text-emerald-400/90">Flags hardcoded 32-lane assumptions as CRITICAL</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="p-3 text-white/70">No confidence score</td>
              <td className="p-3 text-emerald-400/90">Computes severity-weighted confidence score</td>
            </tr>
            <tr className="border-b border-white/5">
              <td className="p-3 text-white/70">No provenance</td>
              <td className="p-3 text-emerald-400/90">Explicit live/cached/demo provenance labels</td>
            </tr>
            <tr>
              <td className="p-3 text-red-400/80">Silent correctness risk on AMD wavefront-64</td>
              <td className="p-3 text-emerald-400/90">Suggests warpSize-based portable fix</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
