'use client';

import React, { useState } from 'react';
import SourceEditor from './SourceEditor';
import TargetWorkspace from './TargetWorkspace';
import { translateCode } from '@/lib/api';
import CostCalculator from './CostCalculator';

export default function Workspace() {
  const [isTranslating, setIsTranslating] = useState(false);
  const [hasTranslated, setHasTranslated] = useState(false);
  const [rocmCode, setRocmCode] = useState('');
  const [auditLog, setAuditLog] = useState('');

  const handleMigrate = async (cudaCode: string) => {
    setIsTranslating(true);

    try {
      const response = await translateCode(cudaCode);
      setRocmCode(response.rocm_code);
      setAuditLog(response.audit_log);
      setHasTranslated(true);
    } catch (error) {
      alert('Translation failed. Please ensure the backend is running and reachable.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <main className="relative grid flex-1 grid-cols-1 overflow-hidden bg-[#030305]/80 lg:grid-cols-[minmax(420px,0.94fr)_minmax(480px,1.06fr)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-amd-red/60 to-transparent" />
      <div className="pointer-events-none absolute inset-0 circuit-grid opacity-40" />

      <section className="relative z-10 min-h-0 overflow-hidden border-b border-white/10 lg:border-b-0 lg:border-r lg:border-white/10">
        <div className="pointer-events-none absolute right-0 top-0 z-20 hidden h-full w-[2px] bg-gradient-to-b from-amd-red/60 via-white/10 to-transparent lg:block" />
        <SourceEditor
          isTranslating={isTranslating}
          onMigrate={handleMigrate}
        />
      </section>

      <section className="relative z-10 min-h-0 overflow-hidden flex flex-col">
        <div className="flex-1 min-h-0">
          <TargetWorkspace
            isTranslating={isTranslating}
            hasTranslated={hasTranslated}
            rocmCode={rocmCode}
            auditLog={auditLog}
          />
        </div>
        <div className="shrink-0 border-t border-white/10 bg-[#040407] p-4">
          <CostCalculator />
        </div>
      </section>
    </main>
  );
}
