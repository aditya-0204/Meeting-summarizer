import React, { useState, useEffect, useCallback } from 'react';
import { Meeting, WorkspaceStats, ActionItemStatus } from './types/meeting.js';
import { MeetingApiClient } from './services/meetingService.js';
import { SampleMeeting } from './data/sampleMeetings.js';
import { Navbar } from './components/Navbar.js';
import { DashboardStats } from './components/DashboardStats.js';
import { MeetingCard } from './components/MeetingCard.js';
import { MeetingDetails } from './components/MeetingDetails.js';
import { MeetingUploadModal } from './components/MeetingUploadModal.js';
import {
  Search,
  Filter,
  Plus,
  FileAudio,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Loader2
} from 'lucide-react';

export default function App() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<WorkspaceStats | undefined>(undefined);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [view, setView] = useState<'dashboard' | 'details'>('dashboard');

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load meeting collection
  const loadMeetings = useCallback(async (showSpinner = false) => {
    if (showSpinner) setIsLoading(true);
    try {
      const data = await MeetingApiClient.getAllMeetings();
      setMeetings(data.meetings);
      setStats(data.stats);

      // If viewing a meeting, update its state too
      if (selectedMeeting) {
        const updated = data.meetings.find((m) => m.id === selectedMeeting.id);
        if (updated) {
          setSelectedMeeting(updated);
        }
      }
    } catch (err) {
      console.error('Failed fetching meetings:', err);
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  }, [selectedMeeting]);

  // Initial load
  useEffect(() => {
    loadMeetings(true);
  }, []);

  // Background polling for active processing jobs
  useEffect(() => {
    const hasActiveProcessing = meetings.some((m) =>
      ['UPLOADED', 'PROCESSING', 'TRANSCRIBING', 'SUMMARIZING'].includes(m.status)
    );

    if (!hasActiveProcessing) return;

    const interval = setInterval(() => {
      loadMeetings(false);
    }, 2500);

    return () => clearInterval(interval);
  }, [meetings, loadMeetings]);

  // Handle Audio File Upload
  const handleUploadAudio = async (file: File, title?: string) => {
    setIsUploading(true);
    try {
      const { meeting } = await MeetingApiClient.uploadAudio(file, title);
      await loadMeetings(false);
      setSelectedMeeting(meeting);
      setView('details');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Sample Meeting Loading
  const handleLoadSample = async (sample: SampleMeeting) => {
    setIsUploading(true);
    try {
      const { meeting } = await MeetingApiClient.loadSampleMeeting({
        title: sample.title,
        originalFileName: sample.originalFileName,
        transcript: sample.transcript,
        durationSeconds: sample.durationSeconds
      });
      await loadMeetings(false);
      setSelectedMeeting(meeting);
      setView('details');
    } finally {
      setIsUploading(false);
    }
  };

  // Update Action Item
  const handleUpdateActionItem = async (
    actionItemId: string,
    status: ActionItemStatus,
    owner?: string | null
  ) => {
    if (!selectedMeeting) return;
    try {
      const updated = await MeetingApiClient.updateActionItem(
        selectedMeeting.id,
        actionItemId,
        status,
        owner
      );
      setSelectedMeeting(updated);
      await loadMeetings(false);
    } catch (err) {
      console.error('Failed updating action item:', err);
    }
  };

  // Reprocess Meeting
  const handleReprocessMeeting = async (id: string) => {
    try {
      const reprocessed = await MeetingApiClient.reprocessMeeting(id);
      setSelectedMeeting(reprocessed);
      await loadMeetings(false);
    } catch (err) {
      console.error('Failed reprocessing meeting:', err);
    }
  };

  // Delete Meeting
  const handleDeleteMeeting = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to delete this meeting session and its recording?')) {
      return;
    }
    try {
      await MeetingApiClient.deleteMeeting(id);
      if (selectedMeeting?.id === id) {
        setSelectedMeeting(null);
        setView('dashboard');
      }
      await loadMeetings(false);
    } catch (err) {
      console.error('Failed deleting meeting:', err);
    }
  };

  // Filtered meeting cards
  const filteredMeetings = meetings.filter((m) => {
    const matchesStatus = statusFilter === 'all' || m.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.originalFileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.summary?.executiveSummary && m.summary.executiveSummary.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onNavigateHome={() => {
          setSelectedMeeting(null);
          setView('dashboard');
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'details' && selectedMeeting ? (
          <MeetingDetails
            meeting={selectedMeeting}
            onBack={() => {
              setSelectedMeeting(null);
              setView('dashboard');
            }}
            onUpdateActionItem={handleUpdateActionItem}
            onReprocess={handleReprocessMeeting}
            onDelete={(id) => handleDeleteMeeting(id)}
          />
        ) : (
          /* DASHBOARD VIEW */
          <div className="space-y-6">
            {/* Hero / Workspace Analytics */}
            <DashboardStats stats={stats} />

            {/* Dashboard Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by meeting title, original audio file, or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Status Filter & Refresh */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  {(['all', 'completed', 'processing', 'failed'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-md font-medium capitalize transition-colors cursor-pointer ${
                        statusFilter === st
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => loadMeetings(true)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
                  title="Refresh Meetings List"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Meeting Grid */}
            {isLoading && meetings.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                <p className="text-sm font-medium">Loading meeting sessions...</p>
              </div>
            ) : filteredMeetings.length === 0 ? (
              /* Empty State */
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto my-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                  <FileAudio className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No meeting sessions found</h3>
                <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No recordings match your current search or filter criteria. Try clearing filters.'
                    : 'Upload meeting audio or load a sample scenario to generate high-accuracy transcripts, key decisions, and action item deliverables.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-medium shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload Audio / Sample</span>
                  </button>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onSelect={(m) => {
                      setSelectedMeeting(m);
                      setView('details');
                    }}
                    onDelete={(id, e) => handleDeleteMeeting(id, e)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Upload / Record Modal */}
      <MeetingUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadFile={handleUploadAudio}
        onLoadSample={handleLoadSample}
        isUploading={isUploading}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
          <span>Meeting Intelligence Platform • ASR Speech-to-Text & Structured LLM Synthesis</span>
        </div>
      </footer>
    </div>
  );
}
