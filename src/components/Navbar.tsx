import React from 'react';
import { Mic, Plus, Sparkles } from 'lucide-react';

interface NavbarProps {
  onOpenUpload: () => void;
  onNavigateHome: () => void;
  currentView: 'dashboard' | 'details';
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenUpload,
  onNavigateHome
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div 
          onClick={onNavigateHome}
          className="flex items-center gap-3 cursor-pointer group select-none"
          id="navbar-brand"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                MeetingSummarizer
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                <Sparkles className="w-3 h-3" /> ASR & LLM
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal">
              Meeting Intelligence & Action Item Extraction
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Upload / New Meeting Button */}
          <button
            id="btn-open-upload"
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-md shadow-indigo-600/30 rounded-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Meeting</span>
          </button>
        </div>
      </div>
    </header>
  );
};
