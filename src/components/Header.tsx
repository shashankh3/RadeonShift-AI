'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Database, Activity, Zap } from 'lucide-react';

export default function Header() {
  const [telemetry, setTelemetry] = useState({
    gpu: 'Fetching Live Telemetry...',
    vram: '--',
    compute: '--'
  });
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/pinggy/telemetry', {
          headers: {
            'X-Pinggy-No-Screen': 'true',
            'Cache-Control': 'no-cache'
          },
          cache: 'no-store'
        });
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        if (mounted) {
          let parsedGpu = data.gpu || data.hardware || 'Hardware Unavailable';
          let parsedVram = data.vram || '--';
          let parsedCompute = data.compute || '--';

          if (data.status === 'live' || data.status === 'operational' || data.raw_data) {
            if (parsedGpu === 'Hardware Unavailable') parsedGpu = 'Hardware Connected';
            if (parsedVram === '--') parsedVram = '0%';
            if (parsedCompute === '--') parsedCompute = '0%';
          }

          setTelemetry({
            gpu: parsedGpu,
            vram: parsedVram,
            compute: parsedCompute
          });
          setIsLive(true);
        }
      } catch (e) {
        if (mounted) {
          setIsLive(false); // Live connection failed
          setTelemetry({
            gpu: 'Hardware Unavailable',
            vram: '--',
            compute: '--'
          });
        }
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="relative shrink-0 overflow-hidden border-b border-white/10 bg-[#050507]/90 px-4 py-4 shadow-[0_18px_70px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-amd-red to-transparent shadow-[0_0_28px_rgba(237,28,36,0.85)]" />
        <div className="absolute -top-24 left-1/4 h-44 w-[32rem] bg-amd-red/15 blur-3xl" />
        <div className="absolute bottom-0 right-8 h-px w-80 bg-gradient-to-r from-transparent via-radeon-orange/70 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="amd-chip-cut relative grid h-14 w-14 shrink-0 place-items-center border border-amd-red/45 bg-amd-red/10 shadow-[0_0_34px_rgba(237,28,36,0.26)]">
            <div className="absolute inset-1 border border-white/10" />
            <Zap className="h-7 w-7 text-amd-red drop-shadow-[0_0_12px_rgba(237,28,36,0.95)]" />
          </div>

          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.42em] text-amd-red/90">
              <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
              AMD ROCm Migration Console
            </div>
            <h1 className="truncate text-2xl font-black uppercase italic tracking-[-0.08em] text-white sm:text-3xl">
              Radeon<span className="text-amd-red drop-shadow-[0_0_16px_rgba(237,28,36,0.7)]">Shift</span>{' '}
              <span className="not-italic text-white/60">AI</span>
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-2 xl:min-w-[620px]">
          <div className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            ROCm SMI Telemetry
            <div className={`h-2 w-2 rounded-full ${isLive ? 'bg-emerald-500 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500'}`} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricCard
              icon={<Cpu className="h-4 w-4" />}
              label="GPU"
              value={telemetry.gpu}
              accent="emerald"
            />
            <MetricCard
              icon={<Database className="h-4 w-4" />}
              label="VRAM"
              value={telemetry.vram}
              accent="emerald"
            />
            <MetricCard
              icon={<Activity className="h-4 w-4" />}
              label="Compute"
              value={telemetry.compute}
              accent="emerald"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function MetricCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: 'red' | 'orange' | 'emerald';
}) {
  const accentClasses = {
    red: 'text-amd-red border-amd-red/35 bg-amd-red/10 shadow-[0_0_22px_rgba(237,28,36,0.14)]',
    orange: 'text-radeon-orange border-radeon-orange/35 bg-radeon-orange/10 shadow-[0_0_22px_rgba(255,75,18,0.14)]',
    emerald: 'text-rocm-teal border-rocm-teal/35 bg-rocm-teal/10 shadow-[0_0_22px_rgba(0,124,151,0.14)]',
  };

  return (
    <div className="amd-chip-cut group relative overflow-hidden border border-white/10 bg-white/[0.035] px-4 py-3 backdrop-blur-md transition-all duration-300 hover:border-amd-red/35 hover:bg-white/[0.055]">
      <div className="absolute inset-0 bg-gradient-to-br from-white/7 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex items-center gap-3">
        <div className={`grid h-9 w-9 place-items-center border ${accentClasses[accent]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[10px] font-black uppercase tracking-[0.24em] text-white/38">{label}</div>
          <div className="mt-1 truncate text-xs font-black uppercase tracking-wide text-white sm:text-sm">{value}</div>
        </div>
      </div>
    </div>
  );
}
