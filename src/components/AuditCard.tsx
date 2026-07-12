'use client';

import React from 'react';

interface AuditFinding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  line: number;
  context: string;
  finding: string;
  fix: string;
  auto_fixable: boolean;
  patch: string | null;
}

const SEVERITY_STYLES: Record<string, { border: string; badge: string; badgeBg: string }> = {
  CRITICAL: { border: 'border-l-red-700', badge: 'text-red-100', badgeBg: 'bg-red-700' },
  HIGH:     { border: 'border-l-red-700', badge: 'text-red-100', badgeBg: 'bg-red-700' },
  MEDIUM:   { border: 'border-l-yellow-500', badge: 'text-yellow-900', badgeBg: 'bg-yellow-500' },
  LOW:      { border: 'border-l-blue-500', badge: 'text-blue-100', badgeBg: 'bg-blue-700' },
};

export default function AuditCard({ finding }: { finding: AuditFinding }) {
  const styles = SEVERITY_STYLES[finding.severity] ?? SEVERITY_STYLES.LOW;

  return (
    <div className={`border-l-4 ${styles.border} bg-gray-900 rounded-r-lg p-4 mb-3`}>
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${styles.badgeBg} ${styles.badge}`}>
          {finding.severity}
        </span>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">
          {finding.category}
        </span>
        {finding.line > 0 && (
          <span className="ml-auto text-xs font-mono text-gray-500">
            Line {finding.line}
          </span>
        )}
      </div>

      {/* Code context */}
      {finding.context && finding.context !== 'N/A' && (
        <div className="font-mono text-xs text-gray-300 bg-gray-950 rounded px-3 py-2 mb-3 overflow-x-auto">
          {finding.context}
        </div>
      )}

      {/* Finding description */}
      <p className="text-sm text-gray-200 font-medium mb-3 leading-relaxed">
        {finding.finding}
      </p>

      {/* Fix suggestion */}
      <div className="bg-green-900/30 border border-green-700/50 rounded px-3 py-2 mb-3">
        <div className="text-xs font-black uppercase tracking-wider text-green-400 mb-1">Suggested Fix</div>
        <p className="text-sm text-green-100/90 leading-relaxed">{finding.fix}</p>
      </div>

      {/* Patch diff */}
      {finding.patch && (
        <div className="font-mono text-xs bg-gray-950 rounded px-3 py-2 mb-3 overflow-x-auto">
          {finding.patch.split('\n').map((line, i) => (
            <div key={i} className="text-green-400">
              <span className="select-none">+ </span>{line}
            </div>
          ))}
        </div>
      )}

      {/* Apply Fix button */}
      {finding.auto_fixable && (
        <button
          className="text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded transition-colors"
          onClick={() => navigator.clipboard?.writeText(finding.patch ?? '')}
        >
          Copy Fix
        </button>
      )}
    </div>
  );
}
