'use client';

import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, XCircle, ShieldAlert, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface VerificationGateProps {
  verification: any;
}

export default function VerificationGate({ verification }: VerificationGateProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!verification) return null;

  const status = verification.status;
  
  let Title = "STATIC ANALYSIS COMPLETE";
  let Subtext = "Compiler unavailable; portability findings remain available";
  let Icon = ShieldAlert;
  let colorClass = "text-gray-400";
  let borderClass = "border-gray-500/30";
  let bgClass = "bg-gray-500/10";

  if (status === "compile_verified") {
    Title = "MI300X BENCHMARK MODE";
    Subtext = "HIP source compiled through hipcc";
    Icon = ShieldCheck;
    colorClass = "text-emerald-400";
    borderClass = "border-emerald-500/30";
    bgClass = "bg-emerald-500/10";
  } else if (status === "verified_with_warnings") {
    Title = "VERIFIED WITH REVIEW";
    Subtext = "Translation completed; manual portability review required";
    Icon = AlertTriangle;
    colorClass = "text-amber-400";
    borderClass = "border-amber-400/30";
    bgClass = "bg-amber-400/10";
  } else if (status === "compile_blocked") {
    Title = "COMPILATION BLOCKED";
    Subtext = "HIP compile check reported an error";
    Icon = XCircle;
    colorClass = "text-red-500";
    borderClass = "border-red-500/30";
    bgClass = "bg-red-500/10";
  }

  const ptxCount = verification.static_analysis?.ptx_blocks || 0;
  const warpCount = verification.static_analysis?.warp32_assumptions || 0;
  const gpuName = verification.environment?.gpu;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(verification, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`mt-6 mb-6 amd-surface border transition-all ${borderClass} overflow-hidden`}>
      <div className={`p-4 flex items-center justify-between cursor-pointer hover:bg-white/5`} onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-4">
          <div className={`shrink-0 p-2 border rounded-sm ${borderClass} ${bgClass} ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h4 className={`text-sm font-black uppercase tracking-wide ${colorClass}`}>{Title}</h4>
            <div className="text-[11px] font-medium text-white/50 uppercase tracking-widest mt-1">{Subtext}</div>
            <div className="text-[9px] font-mono text-white/30 mt-1">{verification.timestamp_utc}</div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-4">
            <StatBadge label="PTX Risks" value={ptxCount} alert={ptxCount > 0} />
            <StatBadge label="Warp32" value={warpCount} alert={warpCount > 0} />
            {gpuName && <StatBadge label="Target GPU" value={gpuName.trim()} alert={false} />}
            <StatBadge label="Evid ID" value={verification.evidence_id} alert={false} />
          </div>
          <div className="text-white/40">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>
      
      {expanded && (
        <div className="border-t border-white/10 p-4 bg-black/40">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Verification Evidence</div>
            <button 
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amd-red hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy JSON"}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[9px] font-bold uppercase text-white/40 mb-2">Static Analysis Findings</div>
              {verification.static_analysis?.findings?.length > 0 ? (
                <ul className="space-y-2">
                  {verification.static_analysis.findings.map((f: any, i: number) => (
                    <li key={i} className="text-xs font-mono text-white/70 bg-white/5 p-2 border-l-2 border-amber-500/50">
                      [{f.severity}] {f.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-emerald-400/80 font-mono">No critical static findings.</div>
              )}
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase text-white/40 mb-2">Compiler Stderr</div>
              {verification.compile?.stderr_summary ? (
                <pre className="text-[10px] font-mono text-red-400/90 bg-red-900/20 p-2 whitespace-pre-wrap">
                  {verification.compile.stderr_summary}
                </pre>
              ) : (
                <div className="text-xs text-white/40 font-mono italic">No compiler output.</div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-white/30 italic text-center">
            RadeonShift does not execute uploaded kernels without an explicit safe test harness.
          </div>
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value, alert }: { label: string, value: string | number, alert: boolean }) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-[8px] uppercase tracking-widest text-white/40">{label}</span>
      <span className={`text-[11px] font-mono font-bold ${alert ? 'text-amber-400' : 'text-white/80'}`}>{value}</span>
    </div>
  );
}
