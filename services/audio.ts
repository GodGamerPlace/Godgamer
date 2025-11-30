// Simple synth audio service using Web Audio API
// No external assets required

const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export type SoundType = 'click' | 'win' | 'lose' | 'thinking' | 'confused' | 'pop';

export const playSound = (type: SoundType) => {
  try {
    const ctx = initAudio();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'click':
        // High pitched short blip
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'pop':
        // Bubble pop sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'win':
        // Major chord arpeggio
        osc.disconnect(); // We'll create multiple oscillators
        ['triangle', 'sine'].forEach((wave, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = wave as any;
            o.connect(g);
            g.connect(ctx.destination);
            
            // C5, E5, G5, C6 sequence
            const notes = [523.25, 659.25, 783.99, 1046.50];
            
            notes.forEach((freq, idx) => {
                const time = now + (idx * 0.1);
                o.frequency.setValueAtTime(freq, time);
                g.gain.setValueAtTime(0.05, time);
                g.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
            });
            
            o.start(now);
            o.stop(now + 0.6);
        });
        break;

      case 'lose':
        // Sad trombone-ish slide
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.8);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.8);
        
        // Add a wobble
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 5;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 50;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(now);
        lfo.stop(now + 0.8);
        
        osc.start(now);
        osc.stop(now + 0.8);
        break;

      case 'thinking':
        // Magical chime/glissando
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
        
      case 'confused':
         // Low bonk
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