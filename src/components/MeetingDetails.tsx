import React, { useState } from 'react';
import { Meeting, ActionItemStatus } from '../types/meeting.js';
import { ProcessingProgress } from './ProcessingProgress.js';
import { ExecutiveSummaryTab } from './ExecutiveSummaryTab.js';
import { DecisionsTab } from './DecisionsTab.js';
import { ActionItemsTab } from './ActionItemsTab.js';
import { TranscriptTab } from './TranscriptTab.js';
import { AudioPlayer } from './AudioPlayer.js';
import {
  ArrowLeft,
  Calendar,
  Clock,
  RotateCcw,
  Trash2,
  Download,
  Share2,
  Sparkles,
  ShieldCheck,
  ListChecks,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface MeetingDetailsProps {
  meeting: Meeting;
  onBack: () => void;
  onUpdateActionItem: (actionItemId: string, status: ActionItemStatus, owner?: string | null) => Promise<void>;
  onReprocess: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const MeetingDetails: React.FC<MeetingDetailsProps> = ({
  meeting,
  onBack,
  onUpdateActionItem,
  onReprocess,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'decisions' | 'actions' | 'transcript'>('summary');
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const isProcessing = ['UPLOADED', 'PROCESSING', 'TRANSCRIBING', 'SUMMARIZING'].includes(meeting.status);

  const actionItems = meeting.summary?.actionItems || [];
  const decisions = meeting.summary?.keyDecisions || [];

  const handleReprocessClick = async () => {
    setIsReprocessing(true);
    try {
      await onReprocess(meeting.id);
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleExport = (format: 'markdown' | 'json') => {
    let content = '';
    let filename = `${meeting.title.replace(/[^a-zA-Z0-9]/g, '_')}_summary`;
    let type = 'text/plain';

    if (format === 'json') {
      content = JSON.stringify(meeting, null, 2);
      filename += '.json';
      type = 'application/json';
    } else {
      content = `# ${meeting.title}\n\n`;
      content += `**Date**: ${new Date(meeting.createdAt).toLocaleString()}\n`;
      content += `**File**: ${meeting.originalFileName}\n\n`;

      if (meeting.summary) {
        content += `## Executive Summary\n${meeting.summary.executiveSummary}\n\n`;

        content += `## Key Decisions\n`;
        meeting.summary.keyDecisions.forEach((d, i) => {
          content += `${i + 1}. **${d.decision}**\n   - Context: ${d.context}\n`;
        });
        content += `\n`;

        content += `## Action Items\n`;
        meeting.summary.actionItems.forEach((a, i) => {
          content += `${i + 1}. [${a.status.toUpperCase()}] **${a.task}** (Owner: ${a.owner || 'Not specified'}, Deadline: ${a.deadline || 'Not specified'})\n`;
        });
        content += `\n`;
      }

      content += `## Transcript\n${meeting.transcript}\n`;
      filename += '.md';
      type = 'text/markdown';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Meetings</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Reprocess button */}
          <button
            onClick={handleReprocessClick}
            disabled={isReprocessing || isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            title="Re-run transcription and summarization"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isReprocessing ? 'animate-spin' : ''}`} />
            <span>Reprocess</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-20 py-1 text-xs">
                <button
                  onClick={() => handleExport('markdown')}
                  className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  Export as Markdown (.md)
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                >
                  Export as JSON (.json)
                </button>
              </div>
            )}
          </div>

          {/* Delete button */}
          <button
            onClick={() => onDelete(meeting.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-medium border border-rose-500/20 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Meeting Header Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  meeting.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : meeting.status === 'FAILED'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'
                }`}
              >
                {meeting.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {(meeting.fileSize / (1024 * 1024)).toFixed(2)} MB • {meeting.fileType}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {meeting.title}
            </h1>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
            <span className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <Calendar className="w-4 h-4 text-indigo-400" />
              {new Date(meeting.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Audio Player if available */}
        {meeting.hasAudio && (
          <AudioPlayer
            meetingId={meeting.id}
            hasAudio={meeting.hasAudio}
            fileType={meeting.fileType}
          />
        )}

        {/* Processing state banner if in-progress */}
        {isProcessing && (
          <ProcessingProgress
            status={meeting.status}
            progressPercent={meeting.progressPercent}
            message={meeting.currentStepMessage}
          />
        )}

        {/* Error message if failed */}
        {meeting.status === 'FAILED' && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white mb-1">Processing Encountered an Error</p>
              <p className="leading-relaxed">{meeting.error?.message || 'Failed during analysis.'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-800 bg-slate-900/50 rounded-xl px-3 overflow-x-auto">
        <button
          id="tab-btn-summary"
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'summary'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Executive Summary</span>
        </button>

        <button
          id="tab-btn-decisions"
          onClick={() => setActiveTab('decisions')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'decisions'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Key Decisions</span>
          {decisions.length > 0 && (
            <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {decisions.length}
            </span>
          )}
        </button>

        <button
          id="tab-btn-actions"
          onClick={() => setActiveTab('actions')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'actions'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListChecks className="w-4 h-4" />
          <span>Action Items</span>
          {actionItems.length > 0 && (
            <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
              {actionItems.length}
            </span>
          )}
        </button>

        <button
          id="tab-btn-transcript"
          onClick={() => setActiveTab('transcript')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'transcript'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Speaker Transcript</span>
        </button>
      </div>

      {/* Tab Content Display */}
      <div>
        {activeTab === 'summary' && (
          meeting.summary ? (
            <ExecutiveSummaryTab summary={meeting.summary} />
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-indigo-400 animate-pulse" />
              <p className="text-sm">
                {isProcessing ? 'Executive summary is currently being synthesized...' : 'No summary data available.'}
              </p>
            </div>
          )
        )}

        {activeTab === 'decisions' && (
          <DecisionsTab decisions={decisions} />
        )}

        {activeTab === 'actions' && (
          <ActionItemsTab
            actionItems={actionItems}
            onUpdateStatus={(actionItemId, status, owner) =>
              onUpdateActionItem(actionItemId, status, owner)
            }
          />
        )}

        {activeTab === 'transcript' && (
          <TranscriptTab
            transcript={meeting.transcript}
            segments={meeting.transcriptSegments}
          />
        )}
      </div>
    </div>
  );
};
