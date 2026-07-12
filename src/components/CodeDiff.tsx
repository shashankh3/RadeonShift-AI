'use client';

import React from 'react';

interface CodeDiffProps {
  before: string;
  after: string;
}

export default function CodeDiff({ before, after }: CodeDiffProps) {
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const maxLen = Math.max(beforeLines.length, afterLines.length);

  return (
    <div className="grid grid-cols-2 gap-2 mt-5">
      {/* Left: raw hipify output */}
      <div>
        <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1 px-1">
          Raw hipify-perl output
        </div>
        <div className="bg-gray-950 rounded p-3 text-xs font-mono overflow-x-auto">
          {Array.from({ length: maxLen }, (_, i) => (
            <div key={i} className="text-gray-300 leading-5 whitespace-pre">
              {beforeLines[i] ?? ''}
            </div>
          ))}
        </div>
      </div>

      {/* Right: RadeonShift fixed output */}
      <div>
        <div className="text-xs font-black uppercase tracking-widest text-green-400 mb-1 px-1">
          RadeonShift audited + fixed
        </div>
        <div className="bg-gray-950 rounded p-3 text-xs font-mono overflow-x-auto">
          {Array.from({ length: maxLen }, (_, i) => {
            const bl = beforeLines[i] ?? '';
            const al = afterLines[i] ?? '';
            const changed = bl !== al;
            return (
              <div
                key={i}
                className={`leading-5 whitespace-pre ${changed ? 'text-green-400 bg-green-900/30' : 'text-gray-300'}`}
              >
                {al}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
