'use client';

import React, { useEffect, useState } from 'react';

type Mode = 'full_stack' | 'ai_only' | 'demo_only' | 'loading';

export default function ModeBanner() {
  const [mode, setMode] = useState<Mode>('loading');
  const [hwName, setHwName] = useState('');

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/pinggy/health', {
          headers: { 'X-Pinggy-No-Screen': 'true' }
        });
        if (!res.ok) {
          setMode('demo_only');
          return;
        }
        const data = await res.json();
        setMode(data.mode || 'demo_only');
        setHwName(data.hardware?.hardware || 'Unavailable');
      } catch {
        setMode('demo_only');
      }
    };

    poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, []);

  if (mode === 'loading') return null;

  if (mode === 'full_stack') {
    return (
      <div className="w-full py-2 px-4 text-sm font-medium bg-green-900/50 text-green-300 border-b border-green-700 flex flex-col items-center justify-center text-center">
        <div>🟢 Full Stack Online — Fireworks AI + AMD MI300X Connected</div>
        <div className="text-xs opacity-80 mt-1">🧠 AI: Fireworks AI | ⚡ Hardware: {hwName}</div>
      </div>
    );
  }

  if (mode === 'ai_only') {
    return (
      <div className="w-full py-2 px-4 text-sm font-medium bg-yellow-900/50 text-yellow-300 border-b border-yellow-700 flex flex-col items-center justify-center text-center">
        <div>🟡 AI-Only Mode — Fireworks AI Online, AMD Hardware Offline</div>
        <div className="text-xs opacity-80 mt-1">🧠 AI: Fireworks AI (Cloud) | ⚡ Benchmarking unavailable or cached</div>
      </div>
    );
  }

  return (
    <div className="w-full py-2 px-4 text-sm font-medium bg-orange-900/50 text-orange-300 border-b border-orange-700 flex flex-col items-center justify-center text-center">
      <div>🟠 Emergency Demo Mode — Backend or Hardware Offline</div>
      <div className="text-xs opacity-80 mt-1">🧠 Using preloaded RadeonShift demo artifacts</div>
    </div>
  );
}
