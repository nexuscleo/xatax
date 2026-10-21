import type { Difficulty } from '@vanguarda/content';
import { CORE_VERSION, createWorld, step } from './game';
import type { Input } from './input';

/**
 * Run-length encoded (RLE) representation of consecutive identical inputs.
 */
export interface CompressedInput {
  moveX: number;
  moveY: number;
  buttons: number;
  repeat: number;
}

/**
 * Standard replay serialization format.
 */
export interface ReplayData {
  coreVersion: string;
  seed: number;
  levelId: string;
  difficulty: Difficulty;
  inputs: CompressedInput[];
}

/**
 * Compresses an array of frame-by-frame inputs into RLE format.
 */
export function compressInputs(inputs: Input[]): CompressedInput[] {
  if (inputs.length === 0) {
    return [];
  }

  const result: CompressedInput[] = [];
  const first = inputs[0]!;
  let current: CompressedInput = {
    moveX: first.moveX,
    moveY: first.moveY,
    buttons: first.buttons,
    repeat: 1,
  };

  for (let i = 1; i < inputs.length; i++) {
    const inp = inputs[i]!;
    if (
      inp.moveX === current.moveX &&
      inp.moveY === current.moveY &&
      inp.buttons === current.buttons
    ) {
      current.repeat++;
    } else {
      result.push(current);
      current = {
        moveX: inp.moveX,
        moveY: inp.moveY,
        buttons: inp.buttons,
        repeat: 1,
      };
    }
  }
  result.push(current);
  return result;
}

/**
 * Expands an RLE compressed input list into an uncompressed frame-by-frame array.
 */
export function decompressInputs(compressed: CompressedInput[]): Input[] {
  const result: Input[] = [];
  for (let i = 0; i < compressed.length; i++) {
    const c = compressed[i]!;
    for (let r = 0; r < c.repeat; r++) {
      result.push({
        moveX: c.moveX,
        moveY: c.moveY,
        buttons: c.buttons,
      });
    }
  }
  return result;
}

export interface ReplayResult {
  finalScore: number;
  finalTick: number;
  finalState: string;
  finalCombo: number;
  playerLives: number;
}

/**
 * Headless re-execution of a recorded match.
 * Verifies core version compatibility and guarantees deterministic results.
 */
export function runReplay(replay: ReplayData): ReplayResult {
  if (replay.coreVersion !== CORE_VERSION) {
    throw new Error(
      `Replay core version mismatch: expected ${CORE_VERSION}, got ${replay.coreVersion}`,
    );
  }

  const world = createWorld(replay.seed, replay.levelId, replay.difficulty);
  const inputs = decompressInputs(replay.inputs);

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]!;
    step(world, input);
  }

  return {
    finalScore: world.score,
    finalTick: world.tick,
    finalState: world.state,
    finalCombo: world.combo,
    playerLives: world.player.lives,
  };
}
