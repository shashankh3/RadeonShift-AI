import React, { useState } from 'react';

export default function CostCalculator() {
  const [kernelCount, setKernelCount] = useState(100);
  const manualCost = kernelCount * 4 * 150;
  const radeonshiftCost = kernelCount * 0.12;
  const roi = manualCost > 0 ? Math.round(manualCost / radeonshiftCost) : 0;

  return (
    <div className="bg-black/40 border border-cyan-500/30 rounded-lg p-4">
      <h3 className="text-cyan-400 text-sm font-bold mb-3">Migration Cost Calculator</h3>
      <div className="mb-4">
        <label className="text-gray-400 text-xs block mb-1">CUDA Kernels: {kernelCount}</label>
        <input
          type="range"
          min="1"
          max="1000"
          value={kernelCount}
          onChange={(e) => setKernelCount(Number(e.target.value))}
          className="w-full accent-cyan-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-red-950/30 border border-red-500/30 rounded p-2">
          <div className="text-red-400 text-xs">Manual Migration</div>
          <div className="text-red-300 font-bold">${manualCost.toLocaleString()}</div>
          <div className="text-gray-500 text-xs">{kernelCount * 4} engineer-hours</div>
        </div>
        <div className="bg-green-950/30 border border-green-500/30 rounded p-2">
          <div className="text-green-400 text-xs">RadeonShift</div>
          <div className="text-green-300 font-bold">${radeonshiftCost.toFixed(2)}</div>
          <div className="text-gray-500 text-xs">~{Math.ceil(kernelCount * 0.08)} min compute</div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <span className="text-2xl font-bold text-cyan-400">{roi.toLocaleString()}x</span>
        <span className="text-gray-500 text-xs ml-2">ROI</span>
      </div>
    </div>
  );
}
