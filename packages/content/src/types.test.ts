import { describe, expect, it } from 'vitest';
import { CapsuleTypeSchema, DifficultySchema, EnemyTypeSchema } from './types';

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
});
