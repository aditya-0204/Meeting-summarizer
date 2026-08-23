import React from 'react';
import { WorkspaceStats } from '../types/meeting.js';
import { FileAudio, CheckCircle2, Clock, ListChecks, CheckCheck, AlertCircle } from 'lucide-react';

interface DashboardStatsProps {
  stats?: WorkspaceStats;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const total = stats?.total || 0;
  const completed = stats?.completed || 0;
  const processing = stats?.processing || 0;
  const totalActions = stats?.totalActionItems || 0;
  const completedActions = stats?.completedActionItems || 0;
  const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Meetings */}
      <div 
        id="stat-total-meetings"
        className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm hover:border-slate-700 transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs sm:text-sm font-medium text-slate-400">Total Meetings</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <FileAudio className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{total}</span>
          <span className="text-xs text-slate-400">sessions recorded</span>
        </div>
      </div>

      {/* Completed Intelligence */}
      <div 
        id="stat-completed-meetings"
        className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm hover:border-slate-700 transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs sm:text-sm font-medium text-slate-400">Analyzed & Ready</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">{completed}</span>
          <span className="text-xs text-slate-400">
            {processing > 0 ? `(${processing} processing)` : 'all processed'}
          </span>
        </div>
      </div>

      {/* Action Items Extracted */}
      <div 
        id="stat-action-items"
        className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm hover:border-slate-700 transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs sm:text-sm font-medium text-slate-400">Action Items Extracted</span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <ListChecks className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{totalActions}</span>
          <span className="text-xs text-amber-400/90 font-medium">
            {totalActions - completedActions} pending
          </span>
        </div>
      </div>

      {/* Action Completion Rate */}
      <div 
        id="stat-completion-rate"
        className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm hover:border-slate-700 transition-colors"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs sm:text-sm font-medium text-slate-400">Task Completion Rate</span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <CheckCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-blue-400 tracking-tight">{completionRate}%</span>
          <span className="text-xs text-slate-400">{completedActions} of {totalActions} tasks done</span>
        </div>
      </div>
    </div>
  );
};
