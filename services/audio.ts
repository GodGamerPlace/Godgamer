// Simple synth audio service using Web Audio API
// Includes SFX and a step sequencer for music

const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
let audioCtx: AudioContext | null = null;
let musicSchedulerId: number | null = null;
let nextNoteTime = 0.0;
let currentNoteIndex = 0;
let currentTrack: 'gameplay' | 'win' | null = null;
let masterGain: GainNode | null = null;
let isMuted = false;
let currentVolume = 0.5; // Default volume (0.0 to 1.0)

// Initialize Audio Context
export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = isMuted ? 0 : currentVolume;
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const setVolume = (value: number) => {
  // Value comes in as 0-100, convert to 0-1
  const normalized = Math.max(0, Math.min(1, value / 100));
  currentVolume = normalized;
  
  if (audioCtx && masterGain && !isMuted) {
     masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
     masterGain.gain.setValueAtTime(normalized, audioCtx.currentTime);
  }
};

export const getVolume = () => {
  return Math.round(currentVolume * 100);
};

export const toggleMute = (mute: boolean) => {
  isMuted = mute;
  if (audioCtx && masterGain) {
    const now = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(mute ? 0 : currentVolume, now + 0.1);
  }
};

// --- Sound Effects (SFX) ---

export type SoundType = 'click' | 'win' | 'lose' | 'thinking' | 'confused' | 'pop';

export const playSound = (type: SoundType) => {
  if (isMuted) return;
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(masterGain!); // Connect to master instead of destination

    const now = ctx.currentTime;

    switch (type) {
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'pop':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.1);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'win':
        // SFX for the moment of reveal (before song starts)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(1046.50, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'lose':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.5);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case 'thinking':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
        
      case 'confused':
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
    }
  } catch (e) {
    console.warn("Audio Context failed", e);
  }
};


// --- Music Sequencer ---

// Frequencies for notes
const N = {
  B1: 61.74, D2: 73.42, E2: 82.41, Fs2: 92.50, A2: 110.00,
  B2: 123.47, D3: 146.83, E3: 164.81, Fs3: 185.00, A3: 220.00,
  B3: 246.94, Cs4: 277.18, D4: 293.66, E4: 329.63, Fs4: 369.99, A4: 440.00, B4: 493.88
};

// Simplified Song Data
const TRACKS = {
  gameplay: {
    tempo: 100,
    bass: [
      { f: N.E2, l: 0.5 }, { f: 0, l: 0.5 }, { f: N.E2, l: 0.5 }, { f: 0, l: 0.5 },
      { f: N.A2, l: 0.5 }, { f: 0, l: 0.5 }, { f: N.B2, l: 0.5 }, { f: 0, l: 0.5 }
    ],
    lead: [
      { f: N.B3, l: 0.1 }, { f: 0, l: 0.9 }, { f: N.E4, l: 0.1 }, { f: 0, l: 1.9 },
      { f: N.D4, l: 0.1 }, { f: 0, l: 0.9 }
    ]
  },
  win: {
    // "Song for Denise" / Piano Fantasia style loop
    tempo: 120,
    bass: [
       // Iconic bassline rhythm: 1 & 2 & 3 & 4 &
       // B, B, D, E, F#, E, D, B
       { f: N.B1, l: 0.25 }, { f: N.B1, l: 0.25 }, { f: N.D2, l: 0.25 }, { f: N.E2, l: 0.25 },
       { f: N.Fs2, l: 0.25 }, { f: N.E2, l: 0.25 }, { f: N.D2, l: 0.25 }, { f: N.B1, l: 0.25 },
    ],
    lead: [
       // Simple synth lead stabs
       { f: N.Fs4, l: 1.5 }, { f: 0, l: 0.5 }, { f: N.A4, l: 1.5 }, { f: 0, l: 0.5 },
       { f: N.Fs4, l: 0.5 }, { f: N.E4, l: 0.5 }, { f: N.D4, l: 0.5 }, { f: N.Cs4, l: 0.5 },
       { f: N.B3, l: 1.0 }, { f: 0, l: 1.0 }
    ]
  }
};

const scheduleNote = (trackName: 'gameplay' | 'win', time: number, index: number) => {
  const track = TRACKS[trackName];
  const secondsPerBeat = 60.0 / track.tempo;
  const ctx = audioCtx!;

  // Loop index
  const bassIdx = index % track.bass.length;
  const leadIdx = index % track.lead.length;

  const bassNote = track.bass[bassIdx];
  const leadNote = track.lead[leadIdx];

  // Play Bass
  if (bassNote.f > 0) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = trackName === 'win' ? 'sawtooth' : 'sine';
    osc.frequency.value = bassNote.f;
    
    // Filter for bass
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = trackName === 'win' ? 800 : 400;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain!);

    osc.start(time);
    osc.stop(time + bassNote.l * secondsPerBeat);

    // Envelope
    gain.gain.setValueAtTime(trackName === 'win' ? 0.3 : 0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + bassNote.l * secondsPerBeat);
  }

  // Play Lead
  if (leadNote.f > 0) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = trackName === 'win' ? 'square' : 'triangle';
    osc.frequency.value = leadNote.f;

    osc.connect(gain);
    gain.connect(masterGain!);

    osc.start(time);
    osc.stop(time + leadNote.l * secondsPerBeat);

    gain.gain.setValueAtTime(trackName === 'win' ? 0.15 : 0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + leadNote.l * secondsPerBeat);
  }
};

const scheduler = () => {
  if (!currentTrack || !audioCtx) return;

  const track = TRACKS[currentTrack];
  const secondsPerBeat = 60.0 / track.tempo;
  const lookahead = 25.0; // ms
  const scheduleAheadTime = 0.1; // seconds

  while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
    scheduleNote(currentTrack, nextNoteTime, currentNoteIndex);
    nextNoteTime += 0.25 * secondsPerBeat; // 16th notes resolution roughly (assuming 0.25 beat steps)
    
    currentNoteIndex++;
  }
  
  musicSchedulerId = window.setTimeout(scheduler, lookahead);
};

export const playMusic = (track: 'gameplay' | 'win') => {
  if (currentTrack === track) return;
  
  const ctx = initAudio();
  if (!ctx) return;

  // Stop previous
  if (musicSchedulerId) clearTimeout(musicSchedulerId);
  
  currentTrack = track;
  currentNoteIndex = 0;
  nextNoteTime = ctx.currentTime + 0.1;
  scheduler();
};

export const stopMusic = () => {
  if (musicSchedulerId) clearTimeout(musicSchedulerId);
  currentTrack = null;
};