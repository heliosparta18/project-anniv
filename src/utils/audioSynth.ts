/**
 * Web Audio API Romantic Lo-Fi Procedural Chord Progression Synthesizer
 *
 * Fallback synthesizer for environments where HTML5 audio playback fails,
 * local MP3s do not exist, or browser autoplay restrictions block playback.
 * Plays gentle, soothing lo-fi electric piano chords (Cmaj7 - Am7 - Dm7 - G7)
 * with a warm envelope and zero console errors.
 */

export interface ChordDefinition {
  name: string;
  description: string;
  frequencies: number[];
}

/**
 * Romantic Lo-Fi Chord Progression:
 * 1. Cmaj7 (Root): C3 bass + C4, E4, G4, B4
 * 2. Am7 (Submediant): A2 bass + A3, C4, E4, G4
 * 3. Dm7 (Supertonic): D3 bass + D4, F4, A4, C5
 * 4. G7 (Dominant): G2 bass + G3, B3, D4, F4
 */
export const ROMANTIC_CHORDS: ChordDefinition[] = [
  {
    name: 'Cmaj7',
    description: 'Warm gentle opening (C - E - G - B)',
    frequencies: [130.81, 261.63, 329.63, 392.00, 493.88],
  },
  {
    name: 'Am7',
    description: 'Intimate tender depth (A - C - E - G)',
    frequencies: [110.00, 220.00, 261.63, 329.63, 392.00],
  },
  {
    name: 'Dm7',
    description: 'Soft emotional yearning (D - F - A - C)',
    frequencies: [146.83, 293.66, 349.23, 440.00, 523.25],
  },
  {
    name: 'G7',
    description: 'Gentle nostalgic resolution (G - B - D - F)',
    frequencies: [98.00, 196.00, 246.94, 293.66, 349.23],
  },
];

export class RomanticAudioSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private currentChordIndex: number = 0;
  private volume: number = 0.7;
  private cycleTimer: ReturnType<typeof setTimeout> | null = null;
  private activeVoices: { osc: OscillatorNode; gain: GainNode }[] = [];

  constructor() {
    // Lazy audio context initialization adheres to browser autoplay policies
  }

  /**
   * Initializes or reuses the Web Audio AudioContext safely
   */
  public ensureContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = (
        typeof window !== 'undefined'
          ? (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
          : (globalThis.AudioContext as typeof AudioContext | undefined)
      );

      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
          if (typeof this.ctx.createGain === 'function') {
            this.masterGain = this.ctx.createGain();
            const now = typeof this.ctx.currentTime === 'number' ? this.ctx.currentTime : 0;
            if (this.masterGain.gain && typeof this.masterGain.gain.setValueAtTime === 'function') {
              this.masterGain.gain.setValueAtTime(this.volume, now);
            }
            if (typeof this.masterGain.connect === 'function' && this.ctx.destination) {
              this.masterGain.connect(this.ctx.destination);
            }
          }
        } catch {
          // AudioContext creation failure cleanly caught
          this.ctx = null;
          this.masterGain = null;
        }
      }
    }
    return this.ctx;
  }

  /**
   * Starts procedural playback of the romantic chord progression
   */
  public async start(): Promise<boolean> {
    // Idempotency guard: if already playing, do not spawn duplicate loops or stack voices
    if (this.isPlaying) {
      return true;
    }

    try {
      this.ensureContext();
      if (!this.ctx || !this.masterGain) {
        return false;
      }

      if (this.ctx.state === 'suspended' && typeof this.ctx.resume === 'function') {
        await this.ctx.resume();
      }

      // Check again after async resume in case state changed during await
      if (this.isPlaying) {
        return true;
      }

      this.isPlaying = true;
      this.currentChordIndex = 0;
      this.scheduleNextChord();
      return true;
    } catch {
      // Audio playback restriction caught cleanly
      this.isPlaying = false;
      return false;
    }
  }

  /**
   * Plays a single warm, humanized chord with staggered note onsets and lo-fi envelope
   */
  private playChord(index: number): void {
    if (!this.isPlaying || !this.ctx || !this.masterGain) {
      return;
    }

    const chord = ROMANTIC_CHORDS[index % ROMANTIC_CHORDS.length];
    const now = typeof this.ctx.currentTime === 'number' ? this.ctx.currentTime : 0;
    const voiceDuration = 3.2; // Seconds per chord

    chord.frequencies.forEach((freq, noteIdx) => {
      try {
        const osc = this.ctx!.createOscillator();
        const noteGain = this.ctx!.createGain();

        // Warm triangle wave delivers soft Rhodes / electric piano harmonics
        osc.type = 'triangle';

        // Stagger note onsets by 35ms for gentle fingerpicked strum feel
        const noteStartTime = now + noteIdx * 0.035;

        if (osc.frequency && typeof osc.frequency.setValueAtTime === 'function') {
          osc.frequency.setValueAtTime(freq, noteStartTime);
        }

        // Soft ADSR Envelope: gentle attack, warm decay, soft sustain
        if (noteGain.gain && typeof noteGain.gain.setValueAtTime === 'function') {
          noteGain.gain.setValueAtTime(0.001, noteStartTime);
          if (typeof noteGain.gain.linearRampToValueAtTime === 'function') {
            noteGain.gain.linearRampToValueAtTime(0.22, noteStartTime + 0.05);
          }
          if (typeof noteGain.gain.exponentialRampToValueAtTime === 'function') {
            noteGain.gain.exponentialRampToValueAtTime(0.06, noteStartTime + 1.2);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStartTime + voiceDuration);
          }
        }

        // Optional Biquad lowpass filter for lo-fi warmth if supported
        if (typeof this.ctx!.createBiquadFilter === 'function') {
          try {
            const filter = this.ctx!.createBiquadFilter();
            filter.type = 'lowpass';
            if (filter.frequency && typeof filter.frequency.setValueAtTime === 'function') {
              filter.frequency.setValueAtTime(1000, noteStartTime);
            }
            osc.connect(filter);
            filter.connect(noteGain);
          } catch {
            osc.connect(noteGain);
          }
        } else {
          osc.connect(noteGain);
        }

        noteGain.connect(this.masterGain!);

        if (typeof osc.start === 'function') {
          osc.start(noteStartTime);
        }
        if (typeof osc.stop === 'function') {
          osc.stop(noteStartTime + voiceDuration);
        }

        const voiceEntry = { osc, gain: noteGain };
        this.activeVoices.push(voiceEntry);

        // Clean up completed voice after duration
        setTimeout(() => {
          this.activeVoices = this.activeVoices.filter((v) => v !== voiceEntry);
        }, (voiceDuration + 0.5) * 1000);
      } catch {
        // Safe mock or platform error suppression
      }
    });
  }

  /**
   * Schedules the next chord in the progression
   */
  private scheduleNextChord(): void {
    if (!this.isPlaying) return;

    // Clear any pending timer to ensure exactly one scheduling loop exists
    if (this.cycleTimer) {
      clearTimeout(this.cycleTimer);
      this.cycleTimer = null;
    }

    this.playChord(this.currentChordIndex);

    this.cycleTimer = setTimeout(() => {
      if (this.isPlaying) {
        this.currentChordIndex = (this.currentChordIndex + 1) % ROMANTIC_CHORDS.length;
        this.scheduleNextChord();
      }
    }, 3200);
  }

  /**
   * Stops playback cleanly and disconnects active voices
   */
  public stop(): void {
    this.isPlaying = false;
    if (this.cycleTimer) {
      clearTimeout(this.cycleTimer);
      this.cycleTimer = null;
    }

    // Gracefully stop active oscillators
    for (const voice of this.activeVoices) {
      try {
        if (typeof voice.osc.stop === 'function') {
          voice.osc.stop();
        }
      } catch {
        // Ignored
      }
    }
    this.activeVoices = [];
  }

  /**
   * Updates master gain smoothly without clicks
   */
  public setVolume(vol: number): void {
    // Guard against non-numeric and NaN values (preserves valid volume and avoids Web Audio setValueAtTime crash)
    if (typeof vol !== 'number' || Number.isNaN(vol)) {
      return;
    }

    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.masterGain.gain) {
      const now = (this.ctx && typeof this.ctx.currentTime === 'number') ? this.ctx.currentTime : 0;
      if (typeof this.masterGain.gain.setValueAtTime === 'function') {
        try {
          this.masterGain.gain.setValueAtTime(this.volume, now);
        } catch {
          // AudioParam update error suppression
        }
      }
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentChord(): ChordDefinition {
    return ROMANTIC_CHORDS[this.currentChordIndex % ROMANTIC_CHORDS.length];
  }

  public getVolume(): number {
    return this.volume;
  }
}

// Singleton procedural synthesizer instance
export const romanticSynth = new RomanticAudioSynth();

export function startRomanticChords(volume: number = 0.7): Promise<boolean> {
  romanticSynth.setVolume(volume);
  return romanticSynth.start();
}

export function stopRomanticChords(): void {
  romanticSynth.stop();
}

export function setSynthVolume(vol: number): void {
  romanticSynth.setVolume(vol);
}

export function isSynthPlaying(): boolean {
  return romanticSynth.getIsPlaying();
}
