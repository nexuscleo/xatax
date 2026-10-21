import type { World } from './world';

export type GameUiState = 'menu' | 'playing' | 'paused' | 'worldClear' | 'gameover';

export interface UiSnapshot {
  score: number;
  lives: number;
  weaponLevel: number;
  shield: number;
  bombs: number;
  combo: number;
  bossHp: number | null;
  state: GameUiState;
}

export type Listener = () => void;

/**
 * Pure TypeScript UI store decoupled from the 60 FPS physics loop.
 * Consumed via `useSyncExternalStore` in React and React Native.
 */
export class UiStore {
  private snapshot: UiSnapshot;
  private listeners: Set<Listener> = new Set();

  constructor(initialState: GameUiState = 'playing') {
    this.snapshot = {
      score: 0,
      lives: 3,
      weaponLevel: 1,
      shield: 0,
      bombs: 1,
      combo: 0,
      bossHp: null,
      state: initialState,
    };
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): UiSnapshot => {
    return this.snapshot;
  };

  update(world: World, uiState?: GameUiState): void {
    const nextState = uiState ?? (world.state === 'gameover' ? 'gameover' : 'playing');

    // Only notify if values actually changed
    if (
      this.snapshot.score === world.score &&
      this.snapshot.lives === world.player.lives &&
      this.snapshot.weaponLevel === world.player.weaponLevel &&
      this.snapshot.shield === world.player.shield &&
      this.snapshot.bombs === world.player.bombs &&
      this.snapshot.combo === world.combo &&
      this.snapshot.state === nextState
    ) {
      return;
    }

    this.snapshot = {
      score: world.score,
      lives: world.player.lives,
      weaponLevel: world.player.weaponLevel,
      shield: world.player.shield,
      bombs: world.player.bombs,
      combo: world.combo,
      bossHp: null,
      state: nextState,
    };

    for (const listener of this.listeners) {
      listener();
    }
  }

  setState(state: GameUiState): void {
    if (this.snapshot.state === state) return;
    this.snapshot = {
      ...this.snapshot,
      state,
    };
    for (const listener of this.listeners) {
      listener();
    }
  }
}
