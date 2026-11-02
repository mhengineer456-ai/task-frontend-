import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic, Volume2 } from 'lucide-react';

export default function AudioPlayerBubble({ audioUrl, isSelf = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const seekTime = Number(e.target.value);
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const cycleRate = () => {
    if (!audioRef.current) return;
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Fake waveform bars
  const waveHeights = [20, 45, 70, 30, 85, 40, 95, 60, 35, 80, 50, 90, 65, 40, 75, 30, 55, 85, 45, 60];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: isSelf ? 'rgba(255, 255, 255, 0.15)' : '#f0f9ff',
        padding: '8px 12px',
        borderRadius: '16px',
        border: isSelf ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid #bae6fd',
        minWidth: '240px',
        maxWidth: '320px',
        userSelect: 'none'
      }}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause round button */}
      <button
        type="button"
        onClick={togglePlay}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: isSelf ? '#ffffff' : '#0284c7',
          color: isSelf ? '#0284c7' : '#ffffff',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          transition: 'transform 0.1s ease'
        }}
      >
        {isPlaying ? <Pause style={{ width: '16px', height: '16px' }} /> : <Play style={{ width: '16px', height: '16px', marginLeft: '2px' }} />}
      </button>

      {/* Waveform & Scrubber */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '24px' }}>
          {waveHeights.map((h, i) => {
            const barProgress = (i / waveHeights.length) * 100;
            const isFilled = barProgress <= progressPercent;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  borderRadius: '2px',
                  background: isSelf
                    ? (isFilled ? '#ffffff' : 'rgba(255, 255, 255, 0.4)')
                    : (isFilled ? '#0284c7' : '#bae6fd'),
                  transition: 'background 0.1s ease'
                }}
              />
            );
          })}
        </div>

        {/* Scrub slider hidden over waveform */}
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          style={{
            width: '100%',
            height: '4px',
            accentColor: isSelf ? '#ffffff' : '#0284c7',
            cursor: 'pointer',
            margin: '0',
            opacity: 0.8
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isSelf ? '#ffffff' : '#0369a1' }}>
            {formatTime(currentTime)}
          </span>
          <span style={{ fontSize: '0.65rem', color: isSelf ? 'rgba(255, 255, 255, 0.8)' : '#64748b' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Speed Rate Pill (1x, 1.5x, 2x) */}
      <button
        type="button"
        onClick={cycleRate}
        style={{
          background: isSelf ? 'rgba(255, 255, 255, 0.25)' : '#e0f2fe',
          color: isSelf ? '#ffffff' : '#0284c7',
          border: 'none',
          borderRadius: '10px',
          padding: '3px 6px',
          fontSize: '0.65rem',
          fontWeight: 800,
          cursor: 'pointer',
          flexShrink: 0
        }}
        title="Playback Speed"
      >
        {playbackRate}x
      </button>
    </div>
  );
}
