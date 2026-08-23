import React from 'react';
import { MeetingSummary } from '../types/meeting.js';
import { Sparkles, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ExecutiveSummaryTabProps {
  summary: MeetingSummary;
}

export const ExecutiveSummaryTab: React.FC<ExecutiveSummaryTabProps> = ({ summary }) => {
  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div 
        id="section-executive-summary"
        className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Executive Summary</h3>
            <p className="text-xs text-slate-400">High-level synthesis of meeting outcomes and strategic context</p>
          </div>
        </div>
        <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/50 rounded-lg p-4 border border-slate-800/60">
          {summary.executiveSummary}
        </div>
      </div>

      {/* Key Discussion Points */}
      {summary.keyDiscussionPoints && summary.keyDiscussionPoints.length > 0 && (
        <div 
          id="section-discussion-points"
          className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Key Discussion Topics</h3>
              <p className="text-xs text-slate-400">Core themes and architectural trade-offs explored by participants</p>
            </div>
          </div>
          <ul className="space-y-2.5">
            {summary.keyDiscussionPoints.map((point, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 bg-slate-950/40 border border-slate-800/60 rounded-lg p-3 text-sm text-slate-300"
              >
                <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-mono font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risks & Open Questions */}
      {summary.risksAndOpenQuestions && summary.risksAndOpenQuestions.length > 0 && (
        <div 
          id="section-risks-questions"
          className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 sm:p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Risks & Unresolved Questions</h3>
              <p className="text-xs text-slate-400">Dependencies and edge cases highlighted during the session</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summary.risksAndOpenQuestions.map((risk, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/15 rounded-lg p-3.5 text-xs sm:text-sm text-amber-200/90"
              >
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{risk}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
