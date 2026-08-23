import React from 'react';
import { ProcessingStatus } from '../types/meeting.js';
import { UploadCloud, Mic, BrainCircuit, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface ProcessingProgressProps {
  status: ProcessingStatus;
  progressPercent: number;
  message?: string;
  error?: { message: string } | null;
  compact?: boolean;
}

export const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  status,
  progressPercent,
  message,
  error,
  compact = false
}) => {
  if (status === 'COMPLETED') {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <span>Ready & Summarized</span>
      </div>
    );
  }

  if (status === 'FAILED') {
    return (
      <div className="flex items-center gap-2 text-xs font-medium text-rose-400">
        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
        <span className="truncate">{error?.message || 'Processing failed'}</span>
      </div>
    );
  }

  const steps = [
    { label: 'Upload', icon: UploadCloud, active: status === 'UPLOADED' || progressPercent >= 10 },
    { label: 'ASR Audio', icon: Mic, active: status === 'TRANSCRIBING' || progressPercent >= 25 },
    { label: 'LLM Summary', icon: BrainCircuit, active: status === 'SUMMARIZING' || progressPercent >= 65 },
    { label: 'Finalize', icon: CheckCircle2, active: progressPercent >= 95 }
  ];

  if (compact) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
            <Loader2 className="w-3 h-3 animate-spin" />
            {message || status}
          </span>
          <span className="text-slate-400 font-mono">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-blue-500 h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-indigo-500/20 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            <h4 className="text-sm font-semibold text-white">
              {status === 'TRANSCRIBING' && 'Speech-to-Text Transcription in Progress...'}
              {status === 'SUMMARIZING' && 'LLM Intelligence & Action Item Extraction...'}
              {status === 'UPLOADED' && 'Audio Ingestion & Queueing...'}
              {status === 'PROCESSING' && 'Processing Meeting...'}
            </h4>
          </div>
          <p className="text-xs text-slate-400 mt-1">{message || 'Analyzing audio...'}</p>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
          {progressPercent}% Complete
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 rounded-full h-2.5 mb-5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(5, progressPercent)}%` }}
        />
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all ${
                step.active
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                  : 'bg-slate-800/40 border-slate-800 text-slate-400 opacity-60'
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-[11px] font-medium leading-tight">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
