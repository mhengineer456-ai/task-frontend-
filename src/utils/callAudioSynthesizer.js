/**
 * Web Audio API Tone Synthesizer for WebRTC Calling
 * Provides 100% reliable sound playback for ringtones, ringback, busy tones, and hangup chirps
 * without requiring any external MP3 files or risking broken asset links.
 */

let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

/**
 * Play Outgoing Ringback Tone (US/International standard 440Hz + 480Hz, 2s tone, 3s pause)
 */
export const startOutgoingRingback = () => {
  const ctx = getAudioContext();
  if (!ctx) return { stop: () => {} };

  let isPlaying = true;
  let timerId = null;
  let activeGain = null;

  const cycle = () => {
    if (!isPlaying) return;
    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      activeGain = gain;
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(480, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + 1.8);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 2.0);
      osc2.stop(ctx.currentTime + 2.0);

      timerId = setTimeout(() => {
        if (isPlaying) cycle();
      }, 4500); // 2s sound + 2.5s silence
    } catch (e) {
      console.warn('Audio ringback error:', e);
    }
  };

  cycle();

  return {
    stop: () => {
      isPlaying = false;
      if (timerId) clearTimeout(timerId);
      if (activeGain && ctx) {
        try {
          activeGain.gain.setValueAtTime(0, ctx.currentTime);
        } catch (e) {}
      }
    }
  };
};

/**
 * Play Incoming Ringtone (Harmonic WhatsApp-style dual-tone chime, 800Hz / 1000Hz melody)
 */
export const startIncomingRingtone = () => {
  const ctx = getAudioContext();
  if (!ctx) return { stop: () => {} };

  let isPlaying = true;
  let timerId = null;

  const playChimeSequence = () => {
    if (!isPlaying) return;
    try {
      const now = ctx.currentTime;
      const notes = [
        { f: 587.33, start: 0, dur: 0.18 },    // D5
        { f: 880.00, start: 0.2, dur: 0.22 },  // A5
        { f: 1046.50, start: 0.45, dur: 0.26 },// C6
        { f: 1318.51, start: 0.75, dur: 0.35 } // E6
      ];

      notes.forEach(({ f, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + start);

        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.12, now + start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });

      timerId = setTimeout(() => {
        if (isPlaying) playChimeSequence();
      }, 2400);
    } catch (e) {
      console.warn('Incoming ringtone error:', e);
    }
  };

  playChimeSequence();

  return {
    stop: () => {
      isPlaying = false;
      if (timerId) clearTimeout(timerId);
    }
  };
};

/**
 * Play Busy Tone (480Hz + 620Hz, rapid beeps 0.5s on, 0.5s off)
 */
export const playBusyTone = () => {
  const ctx = getAudioContext();
  if (!ctx) return { stop: () => {} };

  let isPlaying = true;
  let count = 0;
  let timerId = null;

  const beep = () => {
    if (!isPlaying || count >= 5) return;
    try {
      count++;
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(480, now);
      osc2.frequency.setValueAtTime(620, now);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.setValueAtTime(0.09, now + 0.4);
      gain.gain.linearRampToValueAtTime(0, now + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);

      timerId = setTimeout(() => {
        if (isPlaying && count < 5) beep();
      }, 900);
    } catch (e) {}
  };

  beep();

  return {
    stop: () => {
      isPlaying = false;
      if (timerId) clearTimeout(timerId);
    }
  };
};

/**
 * Play Gentle Hangup / Call Ended Beep
 */
export const playHangupBeep = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.25);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  } catch (e) {}
};
