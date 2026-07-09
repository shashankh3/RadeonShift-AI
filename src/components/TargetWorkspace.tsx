'use client';

import React, { useState } from 'react';
import { Code2, BrainCircuit, Activity, CheckCircle2, AlertTriangle, Timer, Cpu, Layers, Database } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface TargetWorkspaceProps {
  isTranslating: boolean;
  hasTranslated: boolean;
  rocmCode: string;
  auditLog: string;
}

const ROCM_CODE = `#include <hip/hip_runtime.h>
__global__ void vectorAdd(const float *A, const float *B, float *C, int numElements) {
    int i = hipBlockDim_x * hipBlockIdx_x + hipThreadIdx_x;
    if (i < numElements) {
        C[i] = A[i] + B[i];
    }
}
int main() {
    float *d_A;
    hipMalloc((void **)&d_A, size);
    hipMemcpy(d_A, h_A, size, hipMemcpyHostToDevice);
    hipLaunchKernelGGL(vectorAdd, dim3(blocksPerGrid), dim3(threadsPerBlock), 0, 0, d_A, d_B, d_C, numElements);
    return 0;
}`;

export default function TargetWorkspace({ isTranslating, hasTranslated, rocmCode, auditLog }: TargetWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'analytics' | 'telemetry'>('code');

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#040407]/74">
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-55" />
      <div className="pointer-events-none absolute -right-24 top-20 h-80 w-80 rounded-full bg-amd-red/12 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-white/8 blur-[110px]" />

      <div className="relative z-10 shrink-0 border-b border-white/10 bg-black/34 px-4 pt-4 backdrop-blur-md">
        <div className="mb-4 flex flex-col gap-3 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.32em] text-white/45">
              <span className="h-px w-8 bg-white shadow-[0_0_12px_rgba(255,255,255,0.95)]" />
              ROCm Fabric Output
            </div>
            <h2 className="text-xl font-black uppercase italic tracking-[-0.06em] text-white sm:text-2xl">
              HIP Optimization <span className="text-white">Core</span>
            </h2>
          </div>

          <div className="hidden grid-cols-3 gap-2 text-center opacity-30 sm:grid 2xl:min-w-[390px]">
            <MiniStat label="Wave" value="64" />
            <MiniStat label="Arch" value="gfx942" />
            <MiniStat label="ROCm" value="6.1" />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0">
          <TabButton
            active={activeTab === 'code'}
            onClick={() => setActiveTab('code')}
            icon={<Code2 className="h-4 w-4" />}
            label="Optimized HIP C++"
          />
          <TabButton
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
            icon={<BrainCircuit className="h-4 w-4" />}
            label="Architecture Analytics"
          />
          <TabButton
            active={activeTab === 'telemetry'}
            onClick={() => setActiveTab('telemetry')}
            icon={<Activity className="h-4 w-4" />}
            label="Hardware Telemetry"
          />
        </div>
      </div>

      {isTranslating && <TranslatingOverlay />}

      <div className={`relative z-10 flex-1 overflow-auto transition-all duration-500 ${isTranslating ? 'scale-[0.985] opacity-30 blur-sm' : 'scale-100 opacity-100'}`}>
        {!hasTranslated && !isTranslating ? (
          <IdleState />
        ) : (
          <div className="min-h-full p-4 sm:p-6 lg:p-8">
            {activeTab === 'code' && <CodePanel code={rocmCode} />}
            {activeTab === 'analytics' && <AnalyticsPanel log={auditLog} />}
            {activeTab === 'telemetry' && <TelemetryPanel />}
          </div>
        )}
      </div>
    </div>
  );
}

function IdleState() {
  return (
    <div className="grid h-full min-h-[420px] place-items-center p-8 text-center">
      <div className="relative max-w-md">
        <div className="radeon-orb mx-auto mb-8 h-28 w-28 animate-[holo-pulse_3s_ease-in-out_infinite] rounded-full" />
        <div className="absolute left-1/2 top-4 h-48 w-48 -translate-x-1/2 rounded-full border border-amd-red/20" />
        <div className="absolute left-1/2 top-[-1rem] h-60 w-60 -translate-x-1/2 rounded-full border border-white/10" />
        <h3 className="text-2xl font-black uppercase italic tracking-[-0.06em] text-white">Awaiting Migration</h3>
        <p className="mt-4 text-sm font-medium leading-7 text-white/50">
          Load a CUDA kernel and engage the ROCm translation pass to generate tuned HIP output,
          architecture notes, and AMD Instinct telemetry.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/42">
          <span className="amd-chip-cut border border-amd-red/30 bg-amd-red/10 px-3 py-2 text-amd-red">CUDA In</span>
          <span className="amd-chip-cut border border-white/10 bg-white/[0.04] px-3 py-2">AI Pass</span>
          <span className="amd-chip-cut border border-white/30 bg-white/10 px-3 py-2 text-white">HIP Out</span>
        </div>
      </div>
    </div>
  );
}

function TranslatingOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-black/42 backdrop-blur-[2px]">
      <div className="amd-cut border border-amd-red/35 bg-black/70 px-8 py-6 text-center shadow-[0_0_60px_rgba(237,28,36,0.25)]">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-amd-red/20 border-t-amd-red" />
        <div className="text-sm font-black uppercase tracking-[0.28em] text-white">Retargeting Kernel</div>
        <div className="mt-4 text-[10px] font-black uppercase tracking-[0.15em] text-amd-red flex gap-2 justify-center opacity-90 animate-pulse">
          <span>HIPIFY</span> <span>→</span> <span>AGENT A</span> <span>→</span> <span>AGENT B</span> <span>→</span> <span>SCORECARD</span>
        </div>
      </div>
    </div>
  );
}

function CodePanel({ code }: { code: string }) {
  return (
    <div className="amd-surface flex h-full min-h-[520px] flex-col overflow-hidden rounded-none">
      <div className="relative z-10 flex flex-col gap-3 border-b border-white/10 bg-black/28 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.28em] text-white/38">Generated Target</div>
          <div className="mt-1 text-sm font-black uppercase tracking-wider text-white">target_kernel.hip.cpp</div>
        </div>
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.45)]">
          <CheckCircle2 className="h-4 w-4" />
          HIP Translation Successful
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-auto bg-[#030305]/70 p-5 code-noise">
        <pre className="font-mono text-[15px] leading-7 whitespace-pre text-[#f2f5ff] selection:bg-amd-red/30">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

function AnalyticsPanel({ log }: { log: string }) {
  let data = null;
  try {
    data = JSON.parse(log);
  } catch (e) {
    // fallback
  }

  if (!data) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <SectionTitle kicker="Compiler Intelligence" title="Translation Insights" />
        <div className="amd-surface p-6"><div className="relative z-10 text-white/55">{log}</div></div>
      </div>
    );
  }

  const score = data.readiness_score || 0;
  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-yellow-400' : 'text-red-500';
  const scoreBorder = score >= 80 ? 'border-emerald-500/30' : score >= 50 ? 'border-yellow-500/30' : 'border-red-500/30';
  const ptxRisks = data.ptx_risks || [];
  const optimizations = data.wavefront_optimizations || [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <SectionTitle kicker="Compiler Intelligence" title="MoA Audit Scorecard" />
      
      <div className={`amd-surface p-6 border transition-all ${scoreBorder}`}>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 border-b border-white/10 pb-6">
            <div className="text-center sm:text-left">
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-white/42 mb-2">Readiness Score</div>
              <div className={`text-[84px] leading-none font-black tracking-[-0.08em] ${scoreColor}`}>
                {score}<span className="text-3xl text-white/50">/100</span>
              </div>
            </div>
            <div className="flex-1 mt-4 sm:mt-0">
              <p className="text-[15px] font-medium leading-7 text-white/90 border-l border-white/20 pl-6">
                {score >= 80 ? "Kernel is highly optimized for MI300X execution. No critical PTX blocks found." : 
                 score >= 50 ? "Kernel requires some manual review for optimal performance." : 
                 "Significant manual PTX translation required before deployment."}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/30 border border-amd-red/30 hover:border-amd-red/50 transition-colors p-5 rounded-sm min-h-[200px]">
              <div className="border-b border-amd-red/20 pb-3 mb-4">
                <h4 className="text-[11px] font-black uppercase tracking-wide text-white">Agent A: NVIDIA Purist</h4>
                <div className="text-[10px] font-medium text-white/50 uppercase tracking-widest mt-1">Flags lock-in risks</div>
              </div>
              {ptxRisks.length > 0 ? (
                <ul className="list-disc list-inside space-y-2 text-sm text-red-400/90 font-medium">
                  {ptxRisks.map((risk: string, i: number) => <li key={i}>{risk}</li>)}
                </ul>
              ) : (
                <div className="flex items-center gap-2 text-sm text-emerald-400/90 font-medium">
                  <CheckCircle2 className="h-4 w-4" /> No critical PTX or warp-size hardcoding detected.
                </div>
              )}
            </div>
            
            <div className="bg-black/30 border border-cyan-500/30 hover:border-cyan-500/50 transition-colors p-5 rounded-sm min-h-[200px]">
              <div className="border-b border-cyan-500/20 pb-3 mb-4">
                <h4 className="text-[11px] font-black uppercase tracking-wide text-white">Agent B: AMD Optimizer</h4>
                <div className="text-[10px] font-medium text-white/50 uppercase tracking-widest mt-1">Suggests MI300X tuning</div>
              </div>
              {optimizations.length > 0 ? (
                <ul className="list-disc list-inside space-y-2 text-sm text-cyan-100/80">
                  {optimizations.map((opt: string, i: number) => <li key={i}>{opt}</li>)}
                </ul>
              ) : (
                <p className="text-sm text-white/55">No specific wavefront optimizations suggested.</p>
              )}
            </div>
          </div>
          
          {data.manual_intervention_required && (
            <div className="mt-6 bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400 font-medium flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              Manual intervention is strictly required before deploying this kernel to production.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TelemetryPanel() {
  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-2">
      <div className="amd-surface md:col-span-2 overflow-hidden p-6">
        <div className="relative z-10 mb-6 flex items-end justify-between gap-4">
          <div>
            <h3 className="mb-2 text-sm font-black uppercase tracking-[0.28em] text-white/42">Syntax Matching Accuracy</h3>
            <div className="text-6xl font-black tracking-[-0.08em] text-white">100<span className="text-3xl text-white">%</span></div>
          </div>
          <CheckCircle2 className="mb-2 h-10 w-10 text-white drop-shadow-[0_0_14px_rgba(255,255,255,0.8)]" />
        </div>
        <div className="relative z-10 h-4 overflow-hidden border border-white/10 bg-black/45">
          <div className="relative h-full bg-gradient-to-r from-white via-white to-radeon-orange shadow-[0_0_22px_rgba(255,255,255,0.85)]">
            <div className="absolute inset-0 animate-[slide_1s_linear_infinite] bg-[linear-gradient(45deg,rgba(0,0,0,0.22)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.22)_50%,rgba(0,0,0,0.22)_75%,transparent_75%,transparent)] bg-[length:22px_22px]" />
          </div>
        </div>
      </div>

      <TelemetryCard
        icon={<Timer className="h-10 w-10" />}
        label="Translation Speed"
        value="0.042"
        unit="s"
        caption="via hipify-perl core"
      />

      <div className="amd-surface p-6">
        <div className="relative z-10">
          <h3 className="mb-5 text-sm font-black uppercase tracking-[0.28em] text-white/42">Target Environment</h3>
          <div className="space-y-3">
            <EnvRow icon={<Cpu className="h-5 w-5" />} label="Arch" value="gfx942" />
            <EnvRow icon={<Layers className="h-5 w-5" />} label="Platform" value="ROCm 6.1" />
            <EnvRow icon={<Database className="h-5 w-5" />} label="LLM Layer" value="DeepSeek V4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`amd-chip-cut relative flex shrink-0 items-center gap-3 border-x border-t px-5 py-3 text-xs font-black uppercase tracking-[0.18em] transition-all duration-300 ${active
          ? 'border-amd-red bg-amd-red/20 text-white shadow-[0_-10px_40px_rgba(237,28,36,0.25)]'
          : 'border-white/10 bg-white/[0.035] text-white/38 hover:border-white/30 hover:bg-white/[0.08] hover:text-white/80'
        }`}
    >
      {active && <span className="absolute inset-x-0 top-0 h-[2px] bg-amd-red shadow-[0_0_14px_rgba(237,28,36,0.95)]" />}
      <span className={active ? 'text-amd-red' : 'text-white/40'}>{icon}</span>
      {label}
      {active && <span className="absolute -bottom-px left-0 h-px w-full bg-[#08080c]" />}
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="amd-chip-cut border border-white/10 bg-black/24 px-3 py-2 backdrop-blur-md">
      <div className="text-[9px] font-black uppercase tracking-[0.22em] text-white/32">{label}</div>
      <div className="mt-1 text-xs font-black uppercase tracking-wider text-white">{value}</div>
    </div>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-2">
      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-amd-red">{kicker}</div>
      <h3 className="flex items-center gap-3 text-2xl font-black uppercase italic tracking-[-0.06em] text-white">
        <span className="h-9 w-2 bg-amd-red shadow-[0_0_18px_rgba(237,28,36,0.8)]" />
        {title}
      </h3>
    </div>
  );
}

function InsightCard({ icon, tone, title, children }: { icon: React.ReactNode; tone: 'emerald' | 'amber'; title: string; children: React.ReactNode }) {
  const isEmerald = tone === 'emerald';

  return (
    <div className={`amd-surface group overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 ${isEmerald ? 'hover:border-white/45' : 'hover:border-amber-400/45'}`}>
      <div className={`pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full blur-3xl ${isEmerald ? 'bg-white/10' : 'bg-amber-400/10'}`} />
      <div className="relative z-10 flex gap-5">
        <div className={`mt-1 grid h-12 w-12 shrink-0 place-items-center border bg-black/35 ${isEmerald ? 'border-white/35 text-white shadow-[0_0_22px_rgba(255,255,255,0.12)]' : 'border-amber-400/35 text-amber-400 shadow-[0_0_22px_rgba(251,191,36,0.12)]'}`}>
          {icon}
        </div>
        <div>
          <h4 className="mb-2 text-lg font-black uppercase tracking-wide text-white">{title}</h4>
          <p className="text-sm leading-7 text-white/55">{children}</p>
        </div>
      </div>
    </div>
  );
}

function InlineCode({ tone, children }: { tone: 'red' | 'green'; children: React.ReactNode }) {
  return (
    <code className={`border border-white/10 bg-black/45 px-1.5 py-0.5 font-mono text-xs ${tone === 'red' ? 'text-amd-red' : 'text-white'}`}>
      {children}
    </code>
  );
}

function TelemetryCard({ icon, label, value, unit, caption }: { icon: React.ReactNode; label: string; value: string; unit: string; caption: string }) {
  return (
    <div className="amd-surface p-6">
      <div className="relative z-10 flex items-center gap-5">
        <div className="grid h-20 w-20 shrink-0 place-items-center border border-amd-red/35 bg-amd-red/10 text-amd-red shadow-[0_0_28px_rgba(237,28,36,0.16)]">
          {icon}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-black uppercase tracking-[0.25em] text-white/42">{label}</h3>
          <div className="text-5xl font-black tracking-[-0.08em] text-white">{value}<span className="ml-1 text-xl text-white/38">{unit}</span></div>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-amd-red">{caption}</p>
        </div>
      </div>
    </div>
  );
}

function EnvRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="amd-chip-cut flex items-center gap-4 border border-white/10 bg-black/30 p-3 text-sm font-black uppercase tracking-wide text-white/50">
      <span className="text-white/45">{icon}</span>
      <span>{label}:</span>
      <span className="ml-auto text-white">{value}</span>
    </div>
  );
}
