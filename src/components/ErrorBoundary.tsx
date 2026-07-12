'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
  error: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error?.message || 'Unexpected error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 bg-black/60 border border-yellow-500/30 min-h-[200px]">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          <div className="text-center">
            <div className="text-sm font-black uppercase tracking-widest text-yellow-500 mb-2">
              {this.props.fallbackLabel || 'Panel Error'}
            </div>
            <p className="text-xs text-white/50 max-w-md">
              This panel encountered an unexpected error and has been safely isolated.{' '}
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="text-amd-red hover:text-white underline"
              >
                Retry
              </button>
            </p>
            {this.state.error && (
              <pre className="mt-3 text-[10px] text-white/30 max-w-md text-left overflow-auto">
                {this.state.error}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
