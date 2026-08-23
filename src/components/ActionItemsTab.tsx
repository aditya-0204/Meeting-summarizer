import React, { useState } from 'react';
import { ActionItem, ActionItemStatus } from '../types/meeting.js';
import {
  ListChecks,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  CircleDashed,
  Search,
  Filter,
  Edit2,
  Check,
  X
} from 'lucide-react';

interface ActionItemsTabProps {
  actionItems: ActionItem[];
  onUpdateStatus: (actionItemId: string, status: ActionItemStatus, owner?: string | null) => Promise<void>;
}

export const ActionItemsTab: React.FC<ActionItemsTabProps> = ({
  actionItems,
  onUpdateStatus
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOwnerText, setEditOwnerText] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredItems = actionItems.filter((item) => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch =
      item.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.owner && item.owner.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.deadline && item.deadline.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = async (item: ActionItem, newStatus: ActionItemStatus) => {
    if (item.status === newStatus) return;
    setUpdatingId(item.id);
    try {
      await onUpdateStatus(item.id, newStatus, item.owner);
    } finally {
      setUpdatingId(null);
    }
  };

  const startEditOwner = (item: ActionItem) => {
    setEditingId(item.id);
    setEditOwnerText(item.owner || '');
  };

  const saveEditOwner = async (item: ActionItem) => {
    setUpdatingId(item.id);
    try {
      const trimmed = editOwnerText.trim();
      await onUpdateStatus(item.id, item.status, trimmed.length > 0 ? trimmed : null);
      setEditingId(null);
    } finally {
      setUpdatingId(null);
    }
  };

  const cancelEditOwner = () => {
    setEditingId(null);
    setEditOwnerText('');
  };

  const completedCount = actionItems.filter((a) => a.status === 'completed').length;

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-amber-400" />
            <span>Extracted Action Items & Deliverables</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {completedCount} of {actionItems.length} tasks completed • Zero-hallucination tracking
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          {(['all', 'pending', 'in_progress', 'completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors cursor-pointer ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st === 'all' ? 'All Tasks' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by task description, owner, or deadline..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Action Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
          <p className="text-sm">No action items found matching current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredItems.map((item) => {
            const isCompleted = item.status === 'completed';
            const isInProgress = item.status === 'in_progress';

            return (
              <div
                key={item.id}
                id={`action-item-${item.id}`}
                className={`bg-slate-900/80 border rounded-xl p-4 sm:p-5 transition-all ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-950/10'
                    : isInProgress
                    ? 'border-blue-500/30 bg-blue-950/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Task Description */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {isCompleted ? (
                          <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : isInProgress ? (
                          <div className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center">
                            <CircleDashed className="w-4 h-4 animate-spin" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 flex items-center justify-center">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <p
                        className={`text-sm font-medium leading-snug ${
                          isCompleted ? 'text-slate-400 line-through' : 'text-white'
                        }`}
                      >
                        {item.task}
                      </p>
                    </div>

                    {/* Metadata: Owner, Deadline, Priority */}
                    <div className="flex flex-wrap items-center gap-3 text-xs ml-8">
                      {/* Owner pill */}
                      <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-md">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        {editingId === item.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editOwnerText}
                              placeholder="Name or leave empty"
                              onChange={(e) => setEditOwnerText(e.target.value)}
                              className="bg-slate-900 border border-indigo-500 px-1.5 py-0.5 rounded text-white text-xs focus:outline-none w-28"
                              autoFocus
                            />
                            <button
                              onClick={() => saveEditOwner(item)}
                              className="text-emerald-400 hover:text-emerald-300 p-0.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEditOwner}
                              className="text-slate-400 hover:text-rose-400 p-0.5"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1">
                            <span className="text-slate-400">Owner:</span>
                            <span className={item.owner ? 'text-white font-medium' : 'text-slate-400 italic'}>
                              {item.owner || 'Not specified'}
                            </span>
                            <button
                              onClick={() => startEditOwner(item)}
                              className="text-slate-400 hover:text-indigo-400 ml-1 p-0.5 cursor-pointer"
                              title="Edit assignee"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </span>
                        )}
                      </div>

                      {/* Deadline pill */}
                      <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-md font-mono">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-slate-400">Deadline:</span>
                        <span className={item.deadline ? 'text-amber-300 font-medium' : 'text-slate-400 italic'}>
                          {item.deadline || 'Not specified'}
                        </span>
                      </div>

                      {/* Priority Tag */}
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                          item.priority === 'high'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : item.priority === 'medium'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.priority} Priority
                      </span>
                    </div>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-8 md:ml-0">
                    <button
                      onClick={() => handleStatusChange(item, 'pending')}
                      disabled={updatingId === item.id}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors cursor-pointer ${
                        item.status === 'pending'
                          ? 'bg-slate-700 text-white border-slate-600 shadow'
                          : 'text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => handleStatusChange(item, 'in_progress')}
                      disabled={updatingId === item.id}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors cursor-pointer ${
                        item.status === 'in_progress'
                          ? 'bg-blue-600 text-white border-blue-500 shadow'
                          : 'text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => handleStatusChange(item, 'completed')}
                      disabled={updatingId === item.id}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors cursor-pointer ${
                        item.status === 'completed'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                          : 'text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      Completed
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
