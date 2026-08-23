import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  FastForward,
  Headphones
} from 'lucide-react';

interface AudioPlayerProps {
  meetingId: string;
  hasAudio: boolean;
  fileType: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ meetingId, hasAudio, fileType }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasError, setHasError] = useState(false);

  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);

  const audioUrl = `/api/meetings/${meetingId}/audio`;
  const isVideo = fileType.startsWith('video/');

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setHasError(false);
  }, [meetingId]);

  const togglePlay = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play().catch((err) => {
        console.warn('Audio playback error:', err);
        setHasError(true);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (!mediaRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    mediaRef.current.muted = nextMuted;
  };

  const changeSpeed = () => {
    if (!mediaRef.current) return;
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    mediaRef.current.playbackRate = nextSpeed;
  };

  const skipSeconds = (seconds: number) => {
    if (!mediaRef.current) return;
    mediaRef.current.currentTime = Math.max(0, Math.min(duration, mediaRef.current.currentTime + seconds));
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec)) return '00:00';
    const mins = Math.floor(sec / 60);
    const remaining = Math.floor(sec % 60);
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  if (!hasAudio || hasError) {
    return null;
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 mb-6 shadow-sm">
      {isVideo ? (
        <video
          ref={mediaRef}
          src={audioUrl}
          preload="metadata"
          className="sr-only"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onError={() => setHasError(true)}
        />
      ) : (
        <audio
          ref={mediaRef}
          src={audioUrl}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onError={() => setHasError(true)}
        />
      )}

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Play / Pause / Skip Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => skipSeconds(-10)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Rewind 10 seconds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 transition-transform active:scale-95 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
          </button>

          <button
            onClick={() => skipSeconds(10)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fast forward 10 seconds"
          >
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Seek timeline */}
        <div className="flex-1 w-full flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 shrink-0">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-xs font-mono text-slate-400 shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Speed & Volume */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={changeSpeed}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono font-semibold transition-colors cursor-pointer"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>

          <button
            onClick={toggleMute}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
