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
