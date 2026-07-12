import React from 'react';
import { Cpu, ShieldAlert, Zap, Layers, Database } from 'lucide-react';

export default function WhyAMDPanel() {
  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.32em] text-white/45">
        <span className="h-px w-8 bg-amd-red shadow-[0_0_12px_rgba(237,28,36,0.95)]" />
        Hardware Architecture Context
      </div>
      <h2 className="text-xl font-black uppercase italic tracking-[-0.06em] text-white">
        WHY <span className="text-amd-red">AMD MI300X</span> MATTERS
      </h2>

      <div className="flex flex-col gap-4 text-sm leading-relaxed text-white/80">
        <div className="rounded-lg border border-white/10 bg-black/40 p-5 shadow-lg">
          <ul className="flex flex-col gap-5">
            <li className="flex gap-4">
              <div className="mt-1 shrink-0 text-amd-red">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <strong className="text-white block mb-1">NVIDIA warp = 32 lanes.</strong>
                CUDA kernels are frequently written with 32-lane warp assumptions baked directly into the code (<code className="bg-white/10 px-1 rounded text-xs">% 32</code>, <code className="bg-white/10 px-1 rounded text-xs">/ 32</code>, shuffle masks, reduction loop bounds).
              </div>
            </li>
            
            <li className="flex gap-4">
              <div className="mt-1 shrink-0 text-emerald-400">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <strong className="text-white block mb-1">AMD wavefront = 64 lanes.</strong>
                AMD Instinct MI300X (gfx942) executes in 64-lane wavefronts. Code that assumes 32 lanes can compile under HIP but produce silently incorrect results on AMD hardware.
              </div>
            </li>

            <li className="flex gap-4 border-t border-white/5 pt-4">
              <div className="mt-1 shrink-0 text-orange-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <strong className="text-white block mb-1">Syntax translation is not correctness.</strong>
                Tools like HIPIFY rename CUDA APIs to HIP APIs. They do not verify that warp-size-dependent logic is still correct for AMD's execution model.
              </div>
            </li>

            <li className="flex gap-4">
              <div className="mt-1 shrink-0 text-blue-400">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <strong className="text-white block mb-1">RadeonShift audits this exact risk.</strong>
                RadeonShift's AI audit layer specifically looks for wavefront-64 assumptions, unsafe shuffle masks, and other AMD-specific portability risks, and suggests <code className="bg-white/10 px-1 rounded text-xs text-blue-300">warpSize</code>-based fixes that work correctly on both architectures.
              </div>
            </li>

            <li className="flex gap-4 border-t border-white/5 pt-4">
              <div className="mt-1 shrink-0 text-purple-400">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <strong className="text-white block mb-1">AMD hardware adds evidence, not just execution.</strong>
                When the AMD MI300X notebook is online, RadeonShift can provide ROCm environment telemetry, compile-check evidence, and benchmark evidence specific to the target hardware.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}


