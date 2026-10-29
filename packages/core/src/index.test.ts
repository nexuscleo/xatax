import { describe, expect, it } from 'vitest';
import {
  BUTTON_BOMB,
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
  UiStore,
  playGameEvents,
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
      { moveX: 0, moveY: -127, buttons: BUTTON_FIRE, repeat: 32 },
      { moveX: 0, moveY: 0, buttons: BUTTON_FIRE, repeat: 268 },
    ];

    const replayData = {
      coreVersion: CORE_VERSION,
      seed,
      levelId: 'world-1',
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

describe('Level data integration', () => {
  it('spawns the configured first wave at its scheduled tick', () => {
    const world = createWorld(321);
    for (let tick = 0; tick < 60; tick++) {
      step(world, createEmptyInput());
    }

    expect(world.enemies.activeCount).toBe(3);
    for (let i = 0; i < world.enemies.activeCount; i++) {
      const enemy = world.enemies.items[i]!;
      expect(enemy.type).toBe('straight_drone');
      expect(enemy.y).toBe(60);
    }
  });

  it('applies configured wave spacing and capsule drops', () => {
    const world = createWorld(987);
    world.tick = world.levelData.waves[3]!.tick - 1;
    world.waveIndex = 3;

    step(world, createEmptyInput());

    expect(world.enemies.activeCount).toBe(5);
    for (let i = 0; i < world.enemies.activeCount; i++) {
      expect(world.enemies.items[i]?.dropCapsule).toBe('weapon');
    }
    expect(world.enemies.items[1]!.x - world.enemies.items[0]!.x).toBeCloseTo(25, 10);
  });

  it('spawns the boss at the level-defined tick', () => {
    const world = createWorld(654);
    world.tick = world.levelData.boss.tick - 1;
    world.waveIndex = world.levelData.waves.length;

    step(world, createEmptyInput());

    expect(world.boss).not.toBeNull();
    expect(world.boss?.hp).toBe(world.boss?.maxHp);
  });

  it('rejects unknown level identifiers instead of using a fallback', () => {
    expect(() => createWorld(1, 'missing-world')).toThrow('Unknown level id "missing-world"');
  });
});

describe('UI store', () => {
  it('reflects boss health and preserves pause until the world ends', () => {
    const world = createWorld(123);
    world.boss = {
      x: 400,
      y: 135,
      prevX: 400,
      prevY: 135,
      radius: 30,
      hp: 40,
      maxHp: 80,
      phase: 2,
      attackTick: 0,
      scoreValue: 5000,
      isDead: false,
    };

    const store = new UiStore('playing');
    store.update(world);
    expect(store.getSnapshot().bossHp).toBe(40);
    expect(store.getSnapshot().bossMaxHp).toBe(80);

    store.setState('paused');
    store.update(world, 'paused');
    expect(store.getSnapshot().state).toBe('paused');

    world.state = 'worldClear';
    store.update(world, 'paused');
    expect(store.getSnapshot().state).toBe('worldClear');
    expect(store.getSnapshot().bossHp).toBe(40);
  });
});

describe('Bomb input', () => {
  it('uses one bomb per press instead of repeating while held', () => {
    const world = createWorld(456);
    const bombInput = { moveX: 0, moveY: 0, buttons: BUTTON_BOMB };

    step(world, bombInput);
    step(world, bombInput);

    expect(world.player.bombs).toBe(2);
    expect(world.events.filter((event) => event.type === 'bomb')).toHaveLength(0);

    step(world, createEmptyInput());
    step(world, bombInput);

    expect(world.player.bombs).toBe(1);
    expect(world.events.filter((event) => event.type === 'bomb')).toHaveLength(1);
  });
});

describe('Audio event bridge', () => {
  it('maps all core events to platform-independent sound identifiers', () => {
    const played: string[] = [];
    playGameEvents(
      [
        { type: 'shot' },
        { type: 'explosion' },
        { type: 'playerHit' },
        { type: 'powerup' },
        { type: 'bossHit' },
        { type: 'bomb' },
        { type: 'extraLife' },
        { type: 'worldClear' },
      ],
      {
        playSfx: (id) => played.push(id),
        playMusic: () => undefined,
        stopMusic: () => undefined,
        setVolume: () => undefined,
      },
    );

    expect(played).toEqual([
      'shot',
      'explosion',
      'damage',
      'powerup',
      'boss-hit',
      'bomb',
      'extra-life',
      'victory',
    ]);
  });
});
