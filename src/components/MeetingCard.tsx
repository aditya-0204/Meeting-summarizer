import React from 'react';
import { Meeting } from '../types/meeting.js';
import { ProcessingProgress } from './ProcessingProgress.js';
import {
  FileAudio,
  Calendar,
  Clock,
  ListChecks,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface MeetingCardProps {
  meeting: Meeting;
  onSelect: (meeting: Meeting) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, onSelect, onDelete }) => {
  const isProcessing = ['UPLOADED', 'PROCESSING', 'TRANSCRIBING', 'SUMMARIZING'].includes(meeting.status);
  const actionItems = meeting.summary?.actionItems || [];
  const completedActions = actionItems.filter((a) => a.status === 'completed').length;
  const decisionsCount = meeting.summary?.keyDecisions?.length || 0;

  const formattedDate = new Date(meeting.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = new Date(meeting.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      id={`meeting-card-${meeting.id}`}
      onClick={() => onSelect(meeting)}
      className="bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer group flex flex-col justify-between"
    >
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileAudio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                {meeting.title}
              </h3>
              <p className="text-xs text-slate-400 font-mono line-clamp-1 mt-0.5">
                {meeting.originalFileName}
              </p>
            </div>
          </div>

          <button
            onClick={(e) => onDelete(meeting.id, e)}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Delete meeting"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Date & Meta */}
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {formattedDate} • {formattedTime}
          </span>
          {meeting.durationSeconds && (
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {Math.floor(meeting.durationSeconds / 60)}m {meeting.durationSeconds % 60}s
            </span>
          )}
        </div>

        {/* Processing bar if active */}
        {isProcessing && (
          <div className="mb-4">
            <ProcessingProgress
              status={meeting.status}
              progressPercent={meeting.progressPercent}
              message={meeting.currentStepMessage}
              compact
            />
          </div>
        )}

        {/* Summary Snippet if completed */}
        {meeting.status === 'COMPLETED' && meeting.summary && (
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {meeting.summary.executiveSummary}
          </p>
        )}

        {/* Error message if failed */}
        {meeting.status === 'FAILED' && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="truncate">{meeting.error?.message || 'Processing failed.'}</span>
          </div>
        )}
      </div>

      {/* Footer / Badges */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        {meeting.status === 'COMPLETED' ? (
          <div className="flex items-center gap-3">
            {actionItems.length > 0 && (
              <span className="flex items-center gap-1 text-slate-300 bg-slate-800 px-2 py-0.5 rounded font-medium">
                <ListChecks className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {completedActions}/{actionItems.length} Tasks Done
                </span>
              </span>
            )}
            {decisionsCount > 0 && (
              <span className="flex items-center gap-1 text-slate-300 bg-slate-800 px-2 py-0.5 rounded font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>{decisionsCount} Decisions</span>
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">
            {isProcessing ? 'Processing pipeline active' : 'Status: ' + meeting.status}
          </span>
        )}

        <span className="inline-flex items-center gap-1 text-indigo-400 font-medium group-hover:translate-x-1 transition-transform">
          <span>View</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};
