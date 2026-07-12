'use client';

import React, { useEffect, useState } from 'react';

type Mode = 'live' | 'fallback' | 'loading';

export default function ModeBanner() {
  const [mode, setMode] = useState<Mode>('loading');
  const [hardwareInfo, setHardwareInfo] = useState('');

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/pinggy/health', {
          headers: { 'X-Pinggy-No-Screen': 'true' }
        });
        const data = await res.json();
        const src = data.source ?? '';
        if (src === 'live_rocm_smi') {
          setMode('live');
          setHardwareInfo(data.hardware ?? 'AMD MI300X');
        } else {
          setMode('fallback');
        }
      } catch {
        setMode('fallback');
      }
    };

    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, []);

  if (mode === 'loading') return null;

  if (mode === 'live') {
    return (
      <div className="w-full py-2 px-4 text-sm font-medium bg-green-900/50 text-green-300 border-b border-green-700">
        🟢 Live AMD Hardware Connected — {hardwareInfo}
      </div>
    );
  }

  return (
    <div className="w-full py-2 px-4 text-sm font-medium bg-yellow-900/50 text-yellow-300 border-b border-yellow-700">
      🟡 Fallback Mode — Translation + Audit Active (Hardware Offline)
    </div>
  );
}
