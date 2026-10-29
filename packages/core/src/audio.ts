import type { GameEventType } from './world';

/**
 * Platform-agnostic contract for audio playback.
 * The core simulation does not call this directly; it emits events into `world.events`,
 * which the platform shell consumes and forwards to AudioPlayer.
 */
export interface AudioPlayer {
  playSfx(id: string): void;
  playMusic(id: string): void;
  stopMusic(): void;
  setVolume(channel: 'music' | 'sfx', value: number): void;
}

const EVENT_SOUNDS: Readonly<Record<GameEventType, string>> = {
  shot: 'shot',
  explosion: 'explosion',
  playerHit: 'damage',
  powerup: 'powerup',
  bossHit: 'boss-hit',
  bomb: 'bomb',
  extraLife: 'extra-life',
  worldClear: 'victory',
};

export function playGameEvents(
  events: readonly { type: GameEventType }[],
  audioPlayer: AudioPlayer,
): void {
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (event) audioPlayer.playSfx(EVENT_SOUNDS[event.type]);
  }
}
