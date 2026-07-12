'use client';

import React, { useState, useRef } from 'react';
import { Rocket, Loader2, FileCode2, Cpu, Activity } from 'lucide-react';

interface SourceEditorProps {
  isTranslating: boolean;
  onMigrate: (code: string) => void;
}

const DEMO_SNIPPETS = {
  SGEMM: {
    'kernel.cu': `__global__ void sgemm(int m, int n, int k, float alpha, const float *A, const float *B, float beta, float *C) {
    int row = blockIdx.y * blockDim.y + threadIdx.y;
    int col = blockIdx.x * blockDim.x + threadIdx.x;
    if (row < m && col < n) {
        float sum = 0.0f;
        for (int i = 0; i < k; ++i) {
            sum += A[row * k + i] * B[i * n + col];
        }
        C[row * n + col] = alpha * sum + beta * C[row * n + col];
    }
}`,
    'main.cu': `int main() {
    dim3 threadsPerBlock(16, 16);
    dim3 blocksPerGrid((n + threadsPerBlock.x - 1) / threadsPerBlock.x, (m + threadsPerBlock.y - 1) / threadsPerBlock.y);
    sgemm<<<blocksPerGrid, threadsPerBlock>>>(m, n, k, alpha, d_A, d_B, beta, d_C);
    return 0;
}`
  },
  VectorAdd: {
    'kernel.cu': `__global__ void vectorAdd(const float *A, const float *B, float *C, int numElements) {
    int i = blockDim.x * blockIdx.x + threadIdx.x;
    if (i < numElements) {
        C[i] = A[i] + B[i];
    }
}`,
    'main.cu': `int main() {
    float *d_A;
    cudaMalloc((void **)&d_A, size);
    cudaMemcpy(d_A, h_A, size, cudaMemcpyHostToDevice);
    vectorAdd<<<blocksPerGrid, threadsPerBlock>>>(d_A, d_B, d_C, numElements);
    return 0;
}`
  },
  Softmax: {
    'kernel.cu': `__global__ void softmax(float *input, float *output, int size) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;
    if (idx < size) {
        float max_val = -INFINITY;
        for (int i = 0; i < size; ++i) max_val = fmaxf(max_val, input[i]);
        float sum = 0.0f;
        for (int i = 0; i < size; ++i) sum += expf(input[i] - max_val);
        output[idx] = expf(input[idx] - max_val) / sum;
    }
}`,
    'main.cu': `int main() {
    softmax<<<blocks, threads>>>(d_input, d_output, size);
    return 0;
}`
  },
  WavefrontBug: {
    'kernel.cu': `__global__ void warpReduceSum(int* input, int* output, int n) {
    int tid = threadIdx.x;
    int lane = tid % 32;
    int warpId = tid / 32;
    int val = 0;

    if (tid < n) {
        val = input[tid];
    }

    for (int offset = 16; offset > 0; offset >>= 1) {
        val += __shfl_down_sync(0xFFFFFFFF, val, offset);
    }

    if (lane == 0) {
        output[warpId] = val;
    }
}`,
    'main.cu': `int main() {
    // Demo entry point
    return 0;
}`
  }
};

const DEFAULT_FILES = DEMO_SNIPPETS.VectorAdd;

export default function SourceEditor({ isTranslating, onMigrate }: SourceEditorProps) {
  const [activeFile, setActiveFile] = useState<'kernel.cu' | 'main.cu'>('kernel.cu');
  const [files, setFiles] = useState(DEFAULT_FILES);
  const [selectedDemoId, setSelectedDemoId] = useState<string | null>('VectorAdd');
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const currentCode = files[activeFile];
  const lineCount = currentCode.split('\n').length;

  return (
    <div className="scanline flex h-full flex-col overflow-hidden bg-[#050507]/78">
      <div className="relative shrink-0 overflow-hidden border-b border-white/10 bg-gradient-to-r from-[#0e0e12]/95 via-[#0a090d]/95 to-[#0e0708]/95 px-4 py-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(237,28,36,0.18),transparent_34%),linear-gradient(90deg,rgba(255,255,255,0.04),transparent_42%)]" />

        <div className="relative flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.32em] text-white/45">
              <span className="h-px w-8 bg-amd-red shadow-[0_0_12px_rgba(237,28,36,0.95)]" />
              Source Ingress
            </div>
            <h2 className="text-xl font-black uppercase italic tracking-[-0.06em] text-white sm:text-2xl">
              CUDA Kernel <span className="text-amd-red">Analyzer</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 2xl:min-w-[360px]">
            <StatusChip label="Parser" value="CUDA C++" />
            <StatusChip label="Lines" value={String(lineCount).padStart(2, '0')} />
            <StatusChip label="Mode" value="HIPIFY" hot />
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-between border-b border-white/10 bg-black/30 px-4 pt-3">
        <div className="flex items-end gap-1 pl-1">
          {(['kernel.cu', 'main.cu'] as const).map((file) => {
            const isActive = activeFile === file;
            return (
              <button
                key={file}
                onClick={() => setActiveFile(file)}
                className={`amd-chip-cut relative flex min-w-[130px] items-center justify-center gap-2 border-x border-t px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ease-out
                  ${isActive
                    ? 'border-amd-red/55 bg-amd-red/10 text-white shadow-[0_-8px_30px_rgba(237,28,36,0.15)]'
                    : 'border-transparent bg-transparent text-white/35 hover:bg-white/[0.04] hover:text-white/70'
                  }`}
              >
                <div
                  className={`absolute inset-x-0 top-0 h-[2px] origin-left bg-amd-red shadow-[0_0_14px_rgba(237,28,36,0.9)] transition-all duration-500 ease-out
                    ${isActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`}
                />

                <div className={`flex items-center overflow-hidden transition-all duration-500 ease-out
                  ${isActive ? 'w-4 opacity-100' : 'w-0 opacity-0'}`}>
                  <FileCode2 className="h-4 w-4 shrink-0 text-amd-red" />
                </div>

                <span>{file}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden items-center gap-4 pb-3 sm:flex">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/80">
            <Activity className="h-3.5 w-3.5" />
            Realtime Syntax Map
          </div>
          <div className="flex items-center gap-2 amd-chip-cut border border-white/40 bg-[#050507] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]">
            <Cpu className="h-3.5 w-3.5" />
            Occupancy-aware pass ready
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-[#07070a]/80 px-4 py-2">
        {([
          { id: 'SGEMM', label: 'Demo: SGEMM' },
          { id: 'VectorAdd', label: 'Demo: Vector Add' },
          { id: 'Softmax', label: 'Demo: Softmax' },
          { id: 'WavefrontBug', label: 'Hero Demo: Wavefront-64 Bug' }
        ] as const).map(({ id, label }) => {
          const isActive = selectedDemoId === id;
          return (
            <button
              key={id}
              onClick={() => {
                setFiles(DEMO_SNIPPETS[id]);
                setSelectedDemoId(id);
              }}
              className={`rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${isActive
                  ? 'border border-amd-red/50 bg-amd-red/10 text-white shadow-[0_0_15px_rgba(237,28,36,0.6)] hover:bg-amd-red/20'
                  : 'border border-white/20 bg-white/[0.02] text-white/60 hover:border-amd-red hover:text-white hover:shadow-[0_0_15px_rgba(237,28,36,0.4)]'
                }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="relative flex flex-1 overflow-hidden bg-[#030305]/88 shadow-inner shadow-black">
        <div ref={lineNumbersRef} className="code-noise w-14 shrink-0 overflow-hidden border-r border-white/10 bg-black/30 px-2 py-5 font-mono text-xs font-bold text-white/18 select-none">
          {Array.from({ length: Math.max(20, lineCount) }).map((_, i) => (
            <div key={i} className="h-7 text-right leading-7">{i + 1}</div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(237,28,36,0.08),transparent_26%),linear-gradient(90deg,rgba(237,28,36,0.035),transparent_18%)]" />

        <textarea
          value={currentCode}
          onChange={(e) => {
            const newCode = e.target.value;
            setFiles(prev => ({ ...prev, [activeFile]: newCode }));
            if (selectedDemoId && DEMO_SNIPPETS[selectedDemoId as keyof typeof DEMO_SNIPPETS][activeFile] !== newCode) {
              setSelectedDemoId(null);
            }
          }}
          onScroll={(e) => {
            if (lineNumbersRef.current) {
              lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
            }
          }}
          spellCheck="false"
          aria-label="CUDA source code editor"
          className="relative flex-1 resize-none overflow-auto whitespace-pre bg-transparent p-5 font-mono text-[15px] leading-7 tracking-wide text-[#f2f5ff] outline-none selection:bg-amd-red/30 placeholder:text-white/20"
        />



        <div className="absolute bottom-6 right-6 z-10">
          <button
            onClick={() => onMigrate(files['kernel.cu'] + '\n\n' + files['main.cu'])}
            disabled={isTranslating}
            className={`amd-btn group relative flex items-center gap-3 overflow-hidden px-7 py-4 font-black uppercase tracking-[0.2em] text-white transition-all duration-300 active:scale-[0.98]
              ${isTranslating
                ? 'cursor-not-allowed bg-amd-red-dark text-white/65 shadow-[0_0_26px_rgba(143,6,11,0.35)]'
                : 'bg-gradient-to-r from-amd-red via-[#ff2b20] to-radeon-orange shadow-[0_0_34px_rgba(237,28,36,0.46)] hover:-translate-y-1 hover:shadow-[0_0_54px_rgba(237,28,36,0.68)]'
              }`}
          >
            <div className="pointer-events-none absolute inset-0 border border-white/25 mix-blend-overlay" />
            <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg] bg-white/24 opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100" />

            {isTranslating ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-white" />
                <span>Translating...</span>
              </>
            ) : (
              <>
                <Rocket className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                <span>Migrate to ROCm</span>
              </>
            )}
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-6 left-6 hidden items-center gap-3 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-white/45 backdrop-blur-md xl:flex">
          <Cpu className="h-3.5 w-3.5 text-amd-red" />
          Wavefront target: 64 lanes
        </div>
      </div>
    </div>
  );
}

function StatusChip({ label, value, hot = false }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="amd-chip-cut border border-white/10 bg-black/24 px-3 py-2 backdrop-blur-md">
      <div className="text-[9px] font-black uppercase tracking-[0.22em] text-white/32">{label}</div>
      <div className={`mt-1 text-xs font-black uppercase tracking-wider ${hot ? 'text-amd-red' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}
