import React from 'react';
import Header from '@/components/Header';
import Workspace from '@/components/Workspace';

export default function Home() {
  return (
    <div className="relative flex h-screen overflow-hidden bg-amd-void font-sans text-amd-text selection:bg-amd-red/30">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-amd-red/20 blur-[100px]" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-radeon-orange/10 blur-[120px]" />
        <div className="absolute bottom-[-18rem] left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-infinity-violet/10 blur-[140px]" />
      </div>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col p-3 sm:p-4 lg:p-5">
        <div className="amd-cut flex min-h-0 flex-1 flex-col overflow-hidden border border-white/10 bg-black/35 shadow-[0_30px_120px_rgba(0,0,0,0.62)] backdrop-blur-2xl">
          <Header />
          <Workspace />
        </div>
      </div>
    </div>
  );
}
