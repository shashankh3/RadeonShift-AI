import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function CostCalculator() {
  const [kernelCount, setKernelCount] = useState(244);
  const [isExpanded, setIsExpanded] = useState(false);

  const manualCost = kernelCount * 4 * 150;
  const radeonshiftCost = kernelCount * 0.12;
  const roi = manualCost > 0 ? Math.round(manualCost / radeonshiftCost) : 0;

  return (
    <div className="amd-surface border-t border-white/10 transition-all duration-300">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.03] transition-colors group"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-left">
          <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white border-r border-white/10 pr-6">Illustrative First-Pass ROI</span>
          <div className="flex items-center gap-4 text-xs font-black uppercase tracking-wider">
            <span className="text-emerald-400 px-3 py-1 bg-emerald-400/10 border border-emerald-400/20">{roi.toLocaleString('en-US')}x ROI</span>
            <span className="text-red-400/90">Manual: ${manualCost.toLocaleString('en-US')}</span>
            <span className="text-white/20">|</span>
            <span className="text-emerald-400/90">RadeonShift: ${radeonshiftCost.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-amd-red transition-colors">
          <span className="hidden sm:inline">{isExpanded ? 'Hide ROI Model' : 'Expand ROI'}</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 pt-4 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="mb-6 mt-2">
            <div className="flex justify-between items-center mb-4">
              <label className="text-[10px] font-black uppercase tracking-[0.28em] text-white/50">Repository Kernel Count</label>
              <span className="text-amd-red font-black text-sm">{kernelCount}</span>
            </div>
            <input
              type="range"
              min="1"
              max="1000"
              value={kernelCount}
              onChange={(e) => setKernelCount(Number(e.target.value))}
              className="w-full h-1.5 bg-black/50 appearance-none cursor-pointer accent-amd-red border border-white/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="bg-black/40 border border-white/10 p-4 amd-chip-cut">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-2">Manual Migration</div>
              <div className="text-red-400 text-xl font-black tracking-tight mb-1">${manualCost.toLocaleString('en-US')}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30">{kernelCount * 4} engineer-hours</div>
            </div>
            <div className="bg-black/40 border border-white/10 p-4 amd-chip-cut">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-2">RadeonShift</div>
              <div className="text-emerald-400 text-xl font-black tracking-tight mb-1">${radeonshiftCost.toFixed(2)}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30">~{Math.ceil(kernelCount * 0.08)} min compute</div>
            </div>
          </div>

          <div className="text-white/30 text-[9px] mt-6 text-center font-black uppercase tracking-[0.28em]">
            Illustrative triage estimate; production migration still requires human validation
          </div>
        </div>
      )}
    </div>
  );
}
