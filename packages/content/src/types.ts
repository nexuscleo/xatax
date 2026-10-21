import { z } from 'zod';

export const EnemyTypeSchema = z.enum([
  'straight_drone',
  'wave_drone',
  'zigzag_drone',
  'shooter',
  'kamikaze',
  'squadron',
  'turret',
  'mine',
]);
export type EnemyType = z.infer<typeof EnemyTypeSchema>;

export const CapsuleTypeSchema = z.enum([
  'weapon',
  'missile',
  'shield',
  'speed',
  'bomb',
  'life',
  'points',
]);
export type CapsuleType = z.infer<typeof CapsuleTypeSchema>;

export const DifficultySchema = z.enum(['easy', 'normal', 'hard']);
export type Difficulty = z.infer<typeof DifficultySchema>;
