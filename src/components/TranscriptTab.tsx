import React, { useState } from 'react';
import { TranscriptSegment } from '../types/meeting.js';
import {
  FileText,
  Search,
  User,
  Copy,
  Check,
  Download,
  Filter
} from 'lucide-react';

interface TranscriptTabProps {
  transcript: string;
  segments: TranscriptSegment[];
}

export const TranscriptTab: React.FC<TranscriptTabProps> = ({
  transcript,
  segments
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState('all');
  const [copied, setCopied] = useState(false);

  // Extract unique speaker list
  const uniqueSpeakers = Array.from(
    new Set(segments.map((s) => s.speaker).filter(Boolean))
  );

  // Filter segments
  const filteredSegments = segments.filter((seg) => {
    const matchesSpeaker = selectedSpeaker === 'all' || seg.speaker === selectedSpeaker;
    const matchesSearch =
      seg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seg.speaker.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSpeaker && matchesSearch;
  });

  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTranscript = () => {
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meeting-transcript-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Color generator for consistent speaker avatars
  const getSpeakerColor = (speaker: string) => {
    const colors = [
      'from-blue-500 to-indigo-600 text-white',
      'from-emerald-500 to-teal-600 text-white',
      'from-amber-500 to-orange-600 text-white',
      'from-purple-500 to-pink-600 text-white',
      'from-cyan-500 to-blue-600 text-white'
    ];
    let hash = 0;
    for (let i = 0; i < speaker.length; i++) {
      hash = speaker.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Verbatim Dialogue Transcript</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {segments.length > 0 ? `${segments.length} dialogue turns` : 'Full text transcript'} • Preserves speaker identity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyTranscript}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadTranscript}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .txt</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transcript text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {uniqueSpeakers.length > 1 && (
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 shrink-0 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSpeaker}
              onChange={(e) => setSelectedSpeaker(e.target.value)}
              className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Speakers ({uniqueSpeakers.length})</option>
              {uniqueSpeakers.map((spk) => (
                <option key={spk} value={spk} className="bg-slate-900 text-white">
                  {spk}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Segments Stream */}
      {segments.length > 0 ? (
        <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 max-h-[600px] overflow-y-auto">
          {filteredSegments.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              No dialogue found matching "{searchQuery}".
            </div>
          ) : (
            filteredSegments.map((seg, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 bg-slate-900/70 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${getSpeakerColor(
                    seg.speaker
                  )} flex items-center justify-center text-xs font-bold shrink-0 shadow-sm`}
                >
                  {seg.speaker.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      {seg.speaker}
                    </span>
                    {seg.timestamp && (
                      <span className="text-[11px] font-mono text-slate-400">
                        {seg.timestamp}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {seg.text}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Fallback for raw text */
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 text-sm text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
          {transcript || 'No transcript text available.'}
        </div>
      )}
    </div>
  );
};
