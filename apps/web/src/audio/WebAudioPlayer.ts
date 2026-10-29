import type { AudioPlayer } from '@vanguarda/core';

interface SynthSound {
  frequency: number;
  duration: number;
  waveform: OscillatorType;
  endFrequency?: number;
}

interface MusicTrack {
  notes: readonly number[];
  beatSeconds: number;
}

const SFX: Readonly<Record<string, SynthSound>> = {
  shot: { frequency: 660, duration: 0.055, waveform: 'square', endFrequency: 420 },
  explosion: { frequency: 180, duration: 0.24, waveform: 'sawtooth', endFrequency: 55 },
  damage: { frequency: 130, duration: 0.3, waveform: 'square', endFrequency: 65 },
  powerup: { frequency: 520, duration: 0.18, waveform: 'triangle', endFrequency: 1040 },
  'boss-hit': { frequency: 240, duration: 0.1, waveform: 'sawtooth', endFrequency: 130 },
  bomb: { frequency: 95, duration: 0.42, waveform: 'sawtooth', endFrequency: 35 },
  'extra-life': { frequency: 740, duration: 0.3, waveform: 'triangle', endFrequency: 1480 },
  victory: { frequency: 392, duration: 0.55, waveform: 'triangle', endFrequency: 784 },
};

const MUSIC: Readonly<Record<string, MusicTrack>> = {
  'world1-theme': {
    notes: [110, 164.81, 220, 164.81, 130.81, 196, 261.63, 196],
    beatSeconds: 0.32,
  },
  'world2-theme': {
    notes: [146.83, 174.61, 220, 174.61, 196, 220, 293.66, 220],
    beatSeconds: 0.28,
  },
  'world3-theme': {
    notes: [196, 220, 246.94, 293.66, 246.94, 220, 174.61, 146.83],
    beatSeconds: 0.24,
  },
};

type AudioContextFactory = () => AudioContext;

export class WebAudioPlayer implements AudioPlayer {
  private context: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private readonly sfxVoices = new Set<OscillatorNode>();
  private readonly musicVoices = new Set<OscillatorNode>();
  private musicTrack: MusicTrack | null = null;
  private nextMusicTime = 0;
  private musicNoteIndex = 0;

  constructor(private readonly contextFactory: AudioContextFactory = () => new AudioContext()) {}

  async start(): Promise<void> {
    if (!this.context) {
      this.context = this.contextFactory();
      this.musicGain = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.musicGain.gain.value = 0.18;
      this.sfxGain.gain.value = 0.35;
      this.musicGain.connect(this.context.destination);
      this.sfxGain.connect(this.context.destination);
    }

    await this.context.resume();
    if (this.context.state !== 'running') {
      throw new Error('O navegador não conseguiu ativar o áudio.');
    }
  }

  playSfx(id: string): void {
    const sound = SFX[id];
    if (!sound) throw new Error(`Efeito sonoro desconhecido: "${id}"`);
    if (!this.context || !this.sfxGain || this.context.state !== 'running') return;
    if (this.sfxVoices.size >= 8) return;

    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    const startAt = this.context.currentTime;
    const endAt = startAt + sound.duration;

    oscillator.type = sound.waveform;
    oscillator.frequency.setValueAtTime(sound.frequency, startAt);
    if (sound.endFrequency !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(sound.endFrequency, endAt);
    }
    envelope.gain.setValueAtTime(0.0001, startAt);
    envelope.gain.exponentialRampToValueAtTime(1, startAt + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, endAt);
    oscillator.connect(envelope);
    envelope.connect(this.sfxGain);
    this.sfxVoices.add(oscillator);
    oscillator.onended = () => this.sfxVoices.delete(oscillator);
    oscillator.start(startAt);
    oscillator.stop(endAt);
  }

  playMusic(id: string): void {
    const track = MUSIC[id];
    if (!track) throw new Error(`Faixa musical desconhecida: "${id}"`);
    if (!this.context || this.context.state !== 'running') return;
    if (this.musicTrack === track) return;

    this.stopMusic();
    this.musicTrack = track;
    this.musicNoteIndex = 0;
    this.nextMusicTime = this.context.currentTime;
  }

  updateMusic(): void {
    if (!this.context || !this.musicGain || !this.musicTrack || this.context.state !== 'running') {
      return;
    }

    const scheduleBefore = this.context.currentTime + 0.12;
    while (this.nextMusicTime < scheduleBefore) {
      this.scheduleMusicNote(this.musicTrack.notes[this.musicNoteIndex]!);
      this.musicNoteIndex = (this.musicNoteIndex + 1) % this.musicTrack.notes.length;
      this.nextMusicTime += this.musicTrack.beatSeconds;
    }
  }

  stopMusic(): void {
    for (const voice of this.musicVoices) {
      voice.stop();
    }
    this.musicVoices.clear();
    this.musicTrack = null;
  }

  setVolume(channel: 'music' | 'sfx', value: number): void {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new RangeError('O volume precisa estar entre 0 e 1.');
    }
    const gain = channel === 'music' ? this.musicGain : this.sfxGain;
    if (gain && this.context) {
      gain.gain.setTargetAtTime(value, this.context.currentTime, 0.02);
    }
  }

  async dispose(): Promise<void> {
    this.stopMusic();
    for (const voice of this.sfxVoices) {
      voice.stop();
    }
    this.sfxVoices.clear();
    if (this.context && this.context.state !== 'closed') {
      await this.context.close();
    }
    this.context = null;
    this.musicGain = null;
    this.sfxGain = null;
  }

  private scheduleMusicNote(frequency: number): void {
    const context = this.context;
    const output = this.musicGain;
    if (!context || !output) return;

    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const startAt = this.nextMusicTime;
    const endAt = startAt + this.musicTrack!.beatSeconds * 0.8;

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, startAt);
    envelope.gain.setValueAtTime(0.0001, startAt);
    envelope.gain.exponentialRampToValueAtTime(0.6, startAt + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.0001, endAt);
    oscillator.connect(envelope);
    envelope.connect(output);
    this.musicVoices.add(oscillator);
    oscillator.onended = () => this.musicVoices.delete(oscillator);
    oscillator.start(startAt);
    oscillator.stop(endAt);
  }
}
