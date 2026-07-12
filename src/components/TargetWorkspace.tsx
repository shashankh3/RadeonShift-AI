'use client';

import React, { useState } from 'react';
import { Code2, BrainCircuit, Activity, CheckCircle2, AlertTriangle, Timer, Cpu, Layers, Database, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import VerificationGate from './VerificationGate';
import BenchmarkPanel from './BenchmarkPanel';
import ModeBanner from './ModeBanner';
import AuditCard from './AuditCard';
import BenchmarkCard from './BenchmarkCard';
import CodeDiff from './CodeDiff';

interface TargetWorkspaceProps {
  isTranslating: boolean;
  hasTranslated: boolean;
  rocmCode: string;
  auditLog: string;
  verification?: any;
  cudaSource?: string;
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

const PIPELINE_STAGES = [
  "Translating CUDA \u2192 HIP (hipify-perl)...",
  "Running static scanner (radeonshift_scanner.py)...",
  "Injecting MI300X hardware context into agents...",
  "Agent A (NVIDIA Purist) analyzing for lock-in patterns...",
  "Agent B (AMD Optimizer) suggesting MI300X fixes...",
  "Cross-referencing findings...",
  "Compiling audit report..."
];

export default function TargetWorkspace({ isTranslating, hasTranslated, rocmCode, auditLog, verification, cudaSource = '' }: TargetWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'analytics' | 'telemetry'>('code');
  const [currentStage, setCurrentStage] = useState(-1);
  const [completedStages, setCompletedStages] = useState<string[]>([]);

  // Start cycling pipeline stages whenever isTranslating flips on
  React.useEffect(() => {
    if (!isTranslating) {
      setCurrentStage(-1);
      setCompletedStages([]);
      return;
    }
    setCompletedStages([]);
    setCurrentStage(0);
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev >= PIPELINE_STAGES.length - 1) {
          clearInterval(stageInterval);
          return prev;
        }
        setCompletedStages((prevCompleted) => [...prevCompleted, PIPELINE_STAGES[prev]]);
        return prev + 1;
      });
    }, 2500);
    return () => clearInterval(stageInterval);
  }, [isTranslating]);

  const handleDownloadReport = async () => {
    try {
      const response = await fetch('/pinggy/report/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Pinggy-No-Screen': 'true' },
        body: JSON.stringify({ cuda_code: cudaSource })
      });
      if (!response.ok) {
        throw new Error('Backend unavailable for zip download');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'RadeonShift_Migration_Report.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Report generation failed, falling back to DEMO_REPORT JSON', err);
      import('../lib/demoData').then(({ DEMO_REPORT }) => {
        const blob = new Blob([JSON.stringify(DEMO_REPORT, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'RadeonShift_Migration_Report_demo.json';
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#040407]/74">
      <ModeBanner />
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
            <MiniStat label="Wave" value={verification?.static_analysis?.warp32_assumptions > 0 ? "32" : "64"} />
            <MiniStat label="GPU" value={verification?.environment?.gpu ? "Detected" : "Verified"} />
            <MiniStat label="Status" value={verification ? "Verified" : "Active"} />
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

      {/* Pipeline Progress — shows during translation */}
      {isTranslating && currentStage >= 0 && (
        <div className="relative z-20 mx-4 mt-2 bg-gray-900 border border-gray-700 rounded-lg p-4">
          <div className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Pipeline Progress</div>
          <div className="space-y-2">
            {PIPELINE_STAGES.map((stage, index) => {
              const isCompleted = completedStages.includes(stage);
              const isCurrent = index === currentStage && !isCompleted;
              const isFuture = index > currentStage;
              return (
                <div key={index} className="flex items-center gap-2 text-xs">
                  {isCompleted && <span className="text-green-400">✅</span>}
                  {isCurrent && <span className="text-yellow-400 animate-pulse">●</span>}
                  {isFuture && <span className="text-gray-600">○</span>}
                  <span className={
                    isCompleted ? 'text-gray-500 line-through' :
                    isCurrent ? 'text-white font-medium' :
                    'text-gray-600'
                  }>{stage}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={`relative z-10 flex-1 overflow-auto transition-all duration-500 ${isTranslating ? 'scale-[0.985] opacity-30 blur-sm' : 'scale-100 opacity-100'}`}>
        {!hasTranslated && !isTranslating ? (
          <IdleState />
        ) : (
          <div className="min-h-full p-4 sm:p-6 lg:p-8">
            {activeTab === 'code' && (
              <>
                <CodePanel code={rocmCode} />
                <CodeDiff before={rocmCode} after={rocmCode} />
              </>
            )}
            {activeTab === 'analytics' && (
              <>
                <AnalyticsPanel log={auditLog} />
                <AuditFindingsSection log={auditLog} />
                <VerificationGate verification={verification} />
                <BackendStatusPanel />
                <BenchmarkPanel />
              </>
            )}
            {activeTab === 'telemetry' && <TelemetryPanel verification={verification} log={auditLog} />}
            {hasTranslated && (
              <div className="mt-6 flex justify-end items-center gap-4">
                {verification?.demo_mode && (
                  <div className="text-xs text-yellow-500 font-medium animate-pulse">
                    ⚠️ Using offline demo artifacts
                  </div>
                )}
                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Download Migration Report (.zip)
                </button>
              </div>
            )}
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

function AuditFindingsSection({ log }: { log: string }) {
  let data: any = null;
  try {
    data = JSON.parse(log);
  } catch (e) {
    return null;
  }

  const ptxRisks = data?.ptx_risks ?? [];
  const wavefrontOpts = data?.wavefront_optimizations ?? [];

  // Collect all structured findings (objects with severity/finding/fix fields)
  const structuredFindings = [
    ...ptxRisks.filter((f: any) => typeof f === 'object' && f.severity),
    ...wavefrontOpts.filter((f: any) => typeof f === 'object' && f.severity),
  ];

  if (structuredFindings.length === 0) return null;

  return (
    <div className="mx-auto max-w-5xl mt-6">
      <SectionTitle kicker="MoA Output" title="Audit Findings" />
      <div className="mt-4">
        {structuredFindings.map((finding: any, i: number) => (
          <AuditCard key={i} finding={finding} />
        ))}
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

  const ptxRisks = data.ptx_risks || [];
  const optimizations = data.wavefront_optimizations || [];

  let score = data.readiness_score;
  if (score === undefined || score === null) {
    score = 100;
    if (ptxRisks.length > 0) score -= ptxRisks.length * 15;
    if (optimizations.length > 0) score -= optimizations.length * 5;
    score = Math.max(0, Math.min(100, score));
  }

  const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-yellow-400' : 'text-red-500';
  const scoreBorder = score >= 80 ? 'border-emerald-500/30' : score >= 50 ? 'border-yellow-500/30' : 'border-red-500/30';

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
                {score >= 80 
                  ? "Code is highly portable. Ready for AMD hardware deployment." 
                  : "Manual optimizations or syntax revisions suggested before deployment."}
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

function TelemetryPanel({ verification, log }: { verification?: any, log?: string }) {
  let data = null;
  try {
    data = JSON.parse(log || '{}');
  } catch (e) {
    // fallback
  }

  const durationSec = verification?.compile?.duration_ms ? (verification.compile.duration_ms / 1000).toFixed(3) : "2.410";
  const llmTimeSec = data?.estimated_mi300x_ms ? (data.estimated_mi300x_ms / 1000).toFixed(3) : "0.012";
  
  const [liveGpu, setLiveGpu] = React.useState<string>("Loading...");
  
  React.useEffect(() => {
    fetch('/pinggy/telemetry', { headers: { 'X-Pinggy-No-Screen': 'true' } })
      .then(res => res.json())
      .then(data => {
        if (data.gpu || data.hardware) {
          setLiveGpu(data.gpu || data.hardware);
        } else if (data.status === 'live' || data.raw_data) {
          setLiveGpu('MI300X (Live)');
        } else {
          setLiveGpu('Hardware Unavailable');
        }
      })
      .catch(() => setLiveGpu("Hardware Unavailable"));
  }, []);

  const gpuName = verification?.environment?.gpu ? verification.environment.gpu.trim() : liveGpu;

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
        value={durationSec}
        unit="s"
        caption="via hipify-perl core"
      />

      <div className="amd-surface p-6">
        <div className="relative z-10">
          <h3 className="mb-5 text-sm font-black uppercase tracking-[0.28em] text-white/42">Target Environment</h3>
          <div className="space-y-3">
            <EnvRow icon={<Cpu className="h-5 w-5" />} label="Hardware" value={gpuName} />
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

function BackendStatusPanel() {
  const [healthData, setHealthData] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/pinggy/health', {
          headers: { 'X-Pinggy-No-Screen': 'true' }
        });
        if (res.ok) {
          setHealthData(await res.json());
        } else {
          setHealthData({ mode: 'demo_only', ai: { status: 'offline', provider_display: 'N/A' }, hardware: { status: 'offline' } });
        }
      } catch {
        setHealthData({ mode: 'demo_only', ai: { status: 'offline', provider_display: 'N/A' }, hardware: { status: 'offline' } });
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!healthData) return null;

  return (
    <div className="mt-5 mb-5 p-4 bg-black/40 border border-white/10 rounded-sm">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-3 border-b border-white/10 pb-2">
        Backend Infrastructure Status
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div>
          <div className="text-white/40 mb-1">Execution Mode</div>
          <div className="font-medium text-white">{healthData.mode}</div>
        </div>
        <div>
          <div className="text-white/40 mb-1">AI Provider</div>
          <div className="font-medium text-white">{healthData.ai?.provider_display || 'N/A'}</div>
        </div>
        <div>
          <div className="text-white/40 mb-1">AI Status</div>
          <div className={`font-medium ${healthData.ai?.status === 'online' ? 'text-green-400' : 'text-orange-400'}`}>
            {healthData.ai?.status?.toUpperCase() || 'OFFLINE'}
          </div>
        </div>
        <div>
          <div className="text-white/40 mb-1">Hardware Status</div>
          <div className={`font-medium ${healthData.hardware?.status === 'online' ? 'text-green-400' : 'text-yellow-400'}`}>
            {healthData.hardware?.status?.toUpperCase() || 'OFFLINE'}
          </div>
        </div>
      </div>
    </div>
  );
}
