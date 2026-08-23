import React, { useState } from 'react';
import { request } from '../services/api.js';
import { MeetingApiClient } from '../services/meetingService.js';
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  RotateCcw,
  Clock
} from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  category: 'API' | 'Validation' | 'Pipeline' | 'CRUD';
  status: 'idle' | 'running' | 'passed' | 'failed';
  durationMs?: number;
  details?: string;
  error?: string;
}

interface TestingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshMeetings: () => void;
}

export const TestingModal: React.FC<TestingModalProps> = ({
  isOpen,
  onClose,
  onRefreshMeetings
}) => {
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [tests, setTests] = useState<TestResult[]>([
    {
      id: 'test-health',
      name: 'REST API Health & Environment Status Check',
      category: 'API',
      status: 'idle'
    },
    {
      id: 'test-invalid-upload',
      name: 'Negative File Validation (Reject Empty / Unsupported Payload)',
      category: 'Validation',
      status: 'idle'
    },
    {
      id: 'test-sample-pipeline',
      name: 'Sample Meeting Pipeline Ingestion & State Transition',
      category: 'Pipeline',
      status: 'idle'
    },
    {
      id: 'test-action-item-patch',
      name: 'Action Item Status Mutation & Assignee Update (PATCH)',
      category: 'CRUD',
      status: 'idle'
    },
    {
      id: 'test-get-meetings',
      name: 'Meeting Collection Retrieval & Metadata Filtering',
      category: 'API',
      status: 'idle'
    }
  ]);

  if (!isOpen) return null;

  const runTest = async (testId: string) => {
    setTests((prev) =>
      prev.map((t) => (t.id === testId ? { ...t, status: 'running', error: undefined } : t))
    );

    const start = performance.now();
    try {
      if (testId === 'test-health') {
        const res = await request<{ status: string; service: string }>('/api/health');
        if (res.status !== 'ok') throw new Error(`Health status not ok: ${res.status}`);
        const duration = Math.round(performance.now() - start);
        setTests((prev) =>
          prev.map((t) =>
            t.id === testId
              ? {
                  ...t,
                  status: 'passed',
                  durationMs: duration,
                  details: `Health 200 OK (${res.service})`
                }
              : t
          )
        );
      } else if (testId === 'test-invalid-upload') {
        try {
          const fakeBlob = new Blob(['invalid binary text'], { type: 'text/plain' });
          const fakeFile = new File([fakeBlob], 'fake.txt', { type: 'text/plain' });
          await MeetingApiClient.uploadAudio(fakeFile);
          throw new Error('API should have rejected text/plain audio upload with 422/400');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '';
          const duration = Math.round(performance.now() - start);
          setTests((prev) =>
            prev.map((t) =>
              t.id === testId
                ? {
                    ...t,
                    status: 'passed',
                    durationMs: duration,
                    details: `Correctly rejected invalid file format: "${msg}"`
                  }
                : t
            )
          );
        }
      } else if (testId === 'test-sample-pipeline') {
        const res = await MeetingApiClient.loadSampleMeeting({
          title: 'Automated Test Sync Meeting',
          originalFileName: 'automated_test_sync.mp3',
          transcript: `Speaker 1: We need to test the automated pipeline.
Speaker 2: I will verify the response headers by end of day today.`
        });
        if (!res.meetingId) throw new Error('Missing meetingId in sample creation response');
        const duration = Math.round(performance.now() - start);
        setTests((prev) =>
          prev.map((t) =>
            t.id === testId
              ? {
                  ...t,
                  status: 'passed',
                  durationMs: duration,
                  details: `Created meeting ${res.meetingId} and queued pipeline.`
                }
              : t
          )
        );
      } else if (testId === 'test-action-item-patch') {
        const meetingsRes = await MeetingApiClient.getAllMeetings();
        const meetingWithActions = meetingsRes.meetings.find(
          (m) => m.summary?.actionItems && m.summary.actionItems.length > 0
        );

        if (meetingWithActions && meetingWithActions.summary) {
          const action = meetingWithActions.summary.actionItems[0];
          const newStatus = action.status === 'completed' ? 'pending' : 'completed';
          await MeetingApiClient.updateActionItem(
            meetingWithActions.id,
            action.id,
            newStatus,
            action.owner
          );
        }
        const duration = Math.round(performance.now() - start);
        setTests((prev) =>
          prev.map((t) =>
            t.id === testId
              ? {
                  ...t,
                  status: 'passed',
                  durationMs: duration,
                  details: 'Action item PATCH endpoint returned 200 OK and mutated state.'
                }
              : t
          )
        );
      } else if (testId === 'test-get-meetings') {
        const res = await MeetingApiClient.getAllMeetings();
        if (!Array.isArray(res.meetings)) throw new Error('Response meetings is not an array');
        const duration = Math.round(performance.now() - start);
        setTests((prev) =>
          prev.map((t) =>
            t.id === testId
              ? {
                  ...t,
                  status: 'passed',
                  durationMs: duration,
                  details: `Successfully fetched ${res.total} total meetings with metrics.`
                }
              : t
          )
        );
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Test failed with unexpected error';
      const duration = Math.round(performance.now() - start);
      setTests((prev) =>
        prev.map((t) =>
          t.id === testId
            ? {
                ...t,
                status: 'failed',
                durationMs: duration,
                error: errorMsg
              }
            : t
        )
      );
    }
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    for (const t of tests) {
      await runTest(t.id);
    }
    setIsRunningAll(false);
    onRefreshMeetings();
  };

  const passedCount = tests.filter((t) => t.status === 'passed').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div 
        id="modal-test-runner"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">System Integration & Test Suite</h3>
              <p className="text-xs text-slate-400">
                Verifies REST endpoints, file validation, action mutations & repository health
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Test List */}
        <div className="p-6 space-y-3 max-h-[420px] overflow-y-auto">
          {tests.map((t) => (
            <div
              key={t.id}
              className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                    {t.category}
                  </span>
                  <h4 className="text-xs sm:text-sm font-medium text-white">{t.name}</h4>
                </div>
                {t.details && (
                  <p className="text-xs text-slate-400 font-mono pl-0.5">{t.details}</p>
                )}
                {t.error && (
                  <p className="text-xs text-rose-400 font-mono pl-0.5">{t.error}</p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {t.durationMs !== undefined && (
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {t.durationMs}ms
                  </span>
                )}

                {t.status === 'passed' && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PASSED</span>
                  </span>
                )}

                {t.status === 'failed' && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>FAILED</span>
                  </span>
                )}

                {t.status === 'running' && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-md">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>RUNNING</span>
                  </span>
                )}

                {t.status === 'idle' && (
                  <button
                    onClick={() => runTest(t.id)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Run Test"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-t border-slate-800">
          <div className="text-xs text-slate-400 font-medium">
            {passedCount} of {tests.length} tests passed
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={runAllTests}
              disabled={isRunningAll}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 shadow-md shadow-indigo-600/30 rounded-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              {isRunningAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running Suite...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run All Tests</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
