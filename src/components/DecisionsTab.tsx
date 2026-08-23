import React from 'react';
import { KeyDecision } from '../types/meeting.js';
import { ShieldCheck, Tag, CheckCircle2 } from 'lucide-react';

interface DecisionsTabProps {
  decisions: KeyDecision[];
}

export const DecisionsTab: React.FC<DecisionsTabProps> = ({ decisions }) => {
  if (!decisions || decisions.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-400" />
        <p className="text-sm">No explicit decisions were recorded in this meeting session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Finalized Decisions & Consensus</h3>
          <p className="text-xs text-slate-400">
            Binding resolutions and architectural choices agreed upon by attendees
          </p>
        </div>
        <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
          {decisions.length} Decisions Recorded
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3.5">
        {decisions.map((item, index) => (
          <div
            key={item.id || index}
            id={`decision-card-${item.id || index}`}
            className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 sm:p-5 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h4 className="text-sm sm:text-base font-semibold text-white leading-snug">
                  {item.decision}
                </h4>
              </div>
              {item.category && (
                <span className="text-[11px] font-medium bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700 shrink-0">
                  {item.category}
                </span>
              )}
            </div>

            {item.context && (
              <div className="ml-8 mt-2 text-xs sm:text-sm text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                <span className="font-medium text-slate-300 mr-1.5">Context & Rationale:</span>
                {item.context}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
