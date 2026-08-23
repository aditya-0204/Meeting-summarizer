import React, { useState, useRef } from 'react';
import { SAMPLE_MEETINGS, SampleMeeting } from '../data/sampleMeetings.js';
import {
  X,
  UploadCloud,
  Mic,
  Square,
  FileAudio,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Play,
  RotateCcw
} from 'lucide-react';

interface MeetingUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFile: (file: File, title?: string) => Promise<void>;
  onLoadSample: (sample: SampleMeeting) => Promise<void>;
  isUploading: boolean;
}

export const MeetingUploadModal: React.FC<MeetingUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadFile,
  onLoadSample,
  isUploading
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'samples'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setErrorMessage(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = [
      '.mp3', '.wav', '.ogg', '.webm', '.m4a', '.mp4', '.aac',
      '.mov', '.avi', '.mpeg', '.mpg', '.flv', '.wmv', '.3gp'
    ];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    const hasValidMime = file.type.startsWith('audio/') || file.type.startsWith('video/');

    if (!hasValidExt && !hasValidMime) {
      setErrorMessage(`Unsupported format "${file.type || file.name}". Please upload a supported audio or video file.`);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage(`File exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
      return;
    }

    setSelectedFile(file);
    if (!customTitle) {
      setCustomTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }
  };

  // Start in-browser microphone recording
  const startRecording = async () => {
    setErrorMessage(null);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      setErrorMessage('Microphone access was denied or not supported in this browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleUploadSubmit = async () => {
    setErrorMessage(null);
    if (activeTab === 'upload') {
      if (!selectedFile) {
        setErrorMessage('Please choose or drop an audio file first.');
        return;
      }
      try {
        await onUploadFile(selectedFile, customTitle);
        onClose();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setErrorMessage(msg);
      }
    } else if (activeTab === 'record') {
      if (!recordedBlob) {
        setErrorMessage('Please record some audio first.');
        return;
      }
      const title = customTitle || `Voice Note ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const file = new File([recordedBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
      try {
        await onUploadFile(file, title);
        onClose();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setErrorMessage(msg);
      }
    }
  };

  const handleSampleSelect = async (sample: SampleMeeting) => {
    setErrorMessage(null);
    try {
      await onLoadSample(sample);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed loading sample';
      setErrorMessage(msg);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div 
        id="modal-upload-meeting"
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-white">Create New Meeting Session</h3>
            <p className="text-xs text-slate-400">
              Upload audio recording, record live speech, or load a pre-configured sample
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40">
          <button
            id="tab-upload-file"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload File</span>
          </button>
          <button
            id="tab-record-mic"
            onClick={() => setActiveTab('record')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'record'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Record Voice</span>
          </button>
          <button
            id="tab-sample-library"
            onClick={() => setActiveTab('samples')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'samples'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Sample Library</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Meeting Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Sprint Planning & Architecture Review"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Drag and drop zone */}
              <div
                id="dropzone-audio"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-500/5'
                    : selectedFile
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-slate-700/80 bg-slate-950/40 hover:border-slate-600'
                }`}
              >
                <input
                  type="file"
                  id="audio-file-input"
                  accept="audio/*,video/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                      <FileAudio className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400 font-mono mb-4">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'audio'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Choose a different file</span>
                    </button>
                  </div>
                ) : (
                  <label htmlFor="audio-file-input" className="cursor-pointer block">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-white mb-1">
                      Click to upload or drag & drop audio
                    </p>
                    <p className="text-xs text-slate-400 mb-2">
                      Supports audio and video files up to 50MB
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-md border border-indigo-500/20">
                      Browse Computer
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Microphone Record */}
          {activeTab === 'record' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Recording Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quick Standup Audio Note"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-8 text-center flex flex-col items-center justify-center">
                {isRecording ? (
                  <div className="space-y-4">
                    <div className="relative flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-rose-500/20 animate-ping absolute" />
                      <div className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 relative">
                        <Mic className="w-7 h-7 animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <span className="text-2xl font-mono font-bold text-white tracking-wider">
                        {formatSeconds(recordingSeconds)}
                      </span>
                      <p className="text-xs text-rose-400 font-medium mt-1">Recording active...</p>
                    </div>
                    <button
                      id="btn-stop-recording"
                      onClick={stopRecording}
                      className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium flex items-center gap-2 mx-auto cursor-pointer shadow"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Stop Recording</span>
                    </button>
                  </div>
                ) : recordedBlob ? (
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-white">Recording Captured!</p>
                    <p className="text-xs text-slate-400 font-mono">
                      Duration: {formatSeconds(recordingSeconds)} ({(recordedBlob.size / 1024).toFixed(1)} KB)
                    </p>
                    <button
                      onClick={startRecording}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mx-auto cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Re-record</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      id="btn-start-recording"
                      onClick={startRecording}
                      className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30 transition-transform hover:scale-105 cursor-pointer"
                    >
                      <Mic className="w-7 h-7" />
                    </button>
                    <p className="text-sm font-medium text-white">Click to start microphone recording</p>
                    <p className="text-xs text-slate-400 max-w-xs">
                      Speak clearly into your microphone to generate a meeting transcript and summary.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Pre-configured Samples */}
          {activeTab === 'samples' && (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              <p className="text-xs text-slate-400 mb-2">
                Select a real-world enterprise meeting scenario to test high-accuracy transcription, decision tracking, and zero-hallucination action item extraction immediately:
              </p>
              {SAMPLE_MEETINGS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSampleSelect(sample)}
                  className="bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-xl cursor-pointer group transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {sample.category}
                      </span>
                      <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors mt-1">
                        {sample.title}
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-slate-400 shrink-0">
                      {Math.floor(sample.durationSeconds / 60)} min
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">
                    {sample.description}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>Includes 3-4 attendees with explicit deadlines & owner assignments</span>
                    <span className="text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Load & Analyze →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {activeTab !== 'samples' && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUploadSubmit}
              disabled={isUploading || (activeTab === 'upload' && !selectedFile) || (activeTab === 'record' && !recordedBlob)}
              className="px-5 py-2 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/30 rounded-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              {isUploading ? (
                <span>Uploading & Starting...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start AI Processing</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
