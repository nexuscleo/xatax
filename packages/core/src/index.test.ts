import { describe, expect, it } from 'vitest';
import {
  BUTTON_FIRE,
  CORE_VERSION,
  EntityPool,
  STEP,
  checkCircleCollision,
  checkCircleTileCollision,
  compressInputs,
  createEmptyInput,
  createRng,
  createWorld,
  decompressInputs,
  runReplay,
  step,
} from './index';

describe('Collision System', () => {
  it('exposes valid fixed simulation step', () => {
    expect(STEP).toBeCloseTo(0.0166667, 5);
  });

  it('detects intersecting circles', () => {
    expect(checkCircleCollision(0, 0, 10, 15, 0, 10)).toBe(true);
    expect(checkCircleCollision(0, 0, 10, 25, 0, 10)).toBe(false);
  });

  it('detects circle-tile intersection correctly', () => {
    // Tile at [100, 100] with size 16 (bounds: [100..116, 100..116])
    expect(checkCircleTileCollision(95, 108, 6, 100, 100, 16)).toBe(true);
    expect(checkCircleTileCollision(90, 108, 5, 100, 100, 16)).toBe(false);
  });
});

describe('Entity Pools', () => {
  it('allocates and swap-removes without memory leaks', () => {
    const pool = new EntityPool(3, () => ({ val: 0 }));
    expect(pool.capacity).toBe(3);
    expect(pool.activeCount).toBe(0);

    const a = pool.acquire();
    const b = pool.acquire();
    const c = pool.acquire();
    const d = pool.acquire();

    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(c).toBeDefined();
    expect(d).toBeUndefined(); // Capacity reached
    expect(pool.activeCount).toBe(3);

    pool.swapRemove(1); // Remove item 1
    expect(pool.activeCount).toBe(2);

    pool.reset();
    expect(pool.activeCount).toBe(0);
  });
});

describe('RNG & Determinism', () => {
  it('produces identical sequences given the same seed', () => {
    const rng1 = createRng(12345);
    const rng2 = createRng(12345);

    for (let i = 0; i < 50; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('guarantees identical game simulation for two separate worlds', () => {
    const seed = 98765;
    const world1 = createWorld(seed, 'world-1', 'normal');
    const world2 = createWorld(seed, 'world-1', 'normal');

    const inputs = [
      { moveX: 0, moveY: 0, buttons: 0 },
      { moveX: 127, moveY: 0, buttons: BUTTON_FIRE },
      { moveX: 127, moveY: 60, buttons: BUTTON_FIRE },
      { moveX: 0, moveY: -60, buttons: 0 },
      { moveX: -127, moveY: 0, buttons: BUTTON_FIRE },
    ];

    for (let frame = 0; frame < 300; frame++) {
      const input = inputs[frame % inputs.length]!;
      step(world1, input);
      step(world2, input);

      expect(world1.tick).toBe(world2.tick);
      expect(world1.player.x).toBeCloseTo(world2.player.x, 5);
      expect(world1.player.y).toBeCloseTo(world2.player.y, 5);
      expect(world1.score).toBe(world2.score);
      expect(world1.combo).toBe(world2.combo);
      expect(world1.enemies.activeCount).toBe(world2.enemies.activeCount);
    }
  });
});

describe('Replay System', () => {
  it('compresses and decompresses input sequences without loss', () => {
    const rawInputs = [
      createEmptyInput(),
      createEmptyInput(),
      createEmptyInput(),
      { moveX: 127, moveY: 0, buttons: BUTTON_FIRE },
      { moveX: 127, moveY: 0, buttons: BUTTON_FIRE },
      createEmptyInput(),
    ];

    const compressed = compressInputs(rawInputs);
    expect(compressed.length).toBe(3);
    expect(compressed[0]!.repeat).toBe(3);
    expect(compressed[1]!.repeat).toBe(2);
    expect(compressed[2]!.repeat).toBe(1);

    const decompressed = decompressInputs(compressed);
    expect(decompressed).toEqual(rawInputs);
  });

  it('golden replay test: reproduces identical score and state', () => {
    const seed = 4242;
    const inputs = [
      { moveX: 0, moveY: 0, buttons: BUTTON_FIRE, repeat: 100 },
      { moveX: 127, moveY: 0, buttons: BUTTON_FIRE, repeat: 50 },
      { moveX: -60, moveY: 60, buttons: BUTTON_FIRE, repeat: 50 },
      { moveX: 0, moveY: -60, buttons: BUTTON_FIRE, repeat: 100 },
    ];

    const replayData = {
      coreVersion: CORE_VERSION,
      seed,
      levelId: 'proto-level-1',
      difficulty: 'normal' as const,
      inputs,
    };

    const result1 = runReplay(replayData);
    const result2 = runReplay(replayData);

    expect(result1.finalScore).toBe(result2.finalScore);
    expect(result1.finalTick).toBe(result2.finalTick);
    expect(result1.finalState).toBe('playing');
    expect(result1.finalScore).toBeGreaterThan(0); // Scored points destroying drones
  });
});
