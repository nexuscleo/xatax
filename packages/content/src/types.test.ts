import { describe, expect, it } from 'vitest';
import { CapsuleTypeSchema, DifficultySchema, EnemyTypeSchema } from './types';
import { LevelDataSchema } from './level';
import { levels } from './level-data';
import { paths } from './index';

describe('@vanguarda/content schemas', () => {
  it('validates standard difficulty levels', () => {
    expect(DifficultySchema.safeParse('easy').success).toBe(true);
    expect(DifficultySchema.safeParse('normal').success).toBe(true);
    expect(DifficultySchema.safeParse('hard').success).toBe(true);
    expect(DifficultySchema.safeParse('impossible').success).toBe(false);
  });

  it('validates base 8 enemy types', () => {
    const enemies = [
      'straight_drone',
      'wave_drone',
      'zigzag_drone',
      'shooter',
      'kamikaze',
      'squadron',
      'turret',
      'mine',
    ];
    for (const enemy of enemies) {
      expect(EnemyTypeSchema.safeParse(enemy).success).toBe(true);
    }
    expect(EnemyTypeSchema.safeParse('unknown_boss').success).toBe(false);
  });

  it('validates capsule types', () => {
    const capsules = ['weapon', 'missile', 'shield', 'speed', 'bomb', 'life', 'points'];
    for (const capsule of capsules) {
      expect(CapsuleTypeSchema.safeParse(capsule).success).toBe(true);
    }
  });

  it('loads the complete World 1 data through its schema', () => {
    const world1 = levels['world-1'];

    expect(world1).toBeDefined();
    expect(world1?.waves).toHaveLength(30);
    expect(world1?.waves.at(-1)?.tick).toBe(10200);
    expect(world1?.boss.tick).toBe(10800);
    expect(new Set(world1?.waves.map((wave) => wave.enemy)).size).toBe(8);
    expect([...new Set(world1?.waves.map((wave) => wave.drop).filter(Boolean))].sort()).toEqual([
      'bomb',
      'life',
      'missile',
      'points',
      'shield',
      'speed',
      'weapon',
    ]);
    expect(world1!.terrain[0]!.length * world1!.tileSize).toBeGreaterThanOrEqual(
      world1!.scrollSpeed * (world1!.boss.tick / 60) + 480,
    );
    expect(LevelDataSchema.safeParse(world1).success).toBe(true);
  });

  it('loads the World 2 prototype and validates it through the schema', () => {
    const world2 = levels['world-2'];

    expect(world2).toBeDefined();
    expect(world2?.waves.length).toBeGreaterThan(12);
    expect(world2?.boss.type).toBe('reactor_sentinel');
    expect(world2?.boss.tick).toBeGreaterThan(world2!.waves.at(-1)!.tick);
    expect(LevelDataSchema.safeParse(world2).success).toBe(true);
  });

  it('loads the World 3 core prototype and validates it through the schema', () => {
    const world3 = levels['world-3'];

    expect(world3).toBeDefined();
    expect(world3?.waves.length).toBeGreaterThan(12);
    expect(world3?.boss.type).toBe('ai_core');
    expect(world3?.boss.tick).toBeGreaterThan(world3!.waves.at(-1)!.tick);
    expect(LevelDataSchema.safeParse(world3).success).toBe(true);
  });

  it('ships generated integer trajectory tables with a fixed sample count', () => {
    expect(Object.keys(paths)).toEqual(['sine_wave', 'zigzag', 'squadron_arc']);
    for (const trajectory of Object.values(paths)) {
      expect(trajectory).toHaveLength(120);
      expect(trajectory.every(Number.isInteger)).toBe(true);
    }
  });

  it('rejects invalid terrain characters and unordered waves', () => {
    const world1 = levels['world-1']!;
    const invalidTerrain = LevelDataSchema.safeParse({
      ...world1,
      terrain: ['.#x'],
    });
    const unorderedWaves = LevelDataSchema.safeParse({
      ...world1,
      waves: [...world1.waves].reverse(),
    });
    const invalidMap = LevelDataSchema.safeParse({
      ...world1,
      terrain: [world1.terrain[0], world1.terrain[1]!.slice(0, -1), ...world1.terrain.slice(2)],
    });

    expect(invalidTerrain.success).toBe(false);
    expect(unorderedWaves.success).toBe(false);
    expect(invalidMap.success).toBe(false);
  });
});
