import { z } from 'zod';
import { EnemyTypeSchema, CapsuleTypeSchema, DifficultySchema } from './types';

export { EnemyTypeSchema, CapsuleTypeSchema, DifficultySchema };
export type { EnemyType, CapsuleType, Difficulty } from './types';

// ─── Trajectory IDs ────────────────────────────────────────────────────────────
export const PathIdSchema = z.enum(['sine_wave', 'zigzag', 'squadron_arc']);
export type PathId = z.infer<typeof PathIdSchema>;

// ─── Boss Type ─────────────────────────────────────────────────────────────────
export const BossTypeSchema = z.enum(['dockyard_guardian', 'reactor_sentinel', 'ai_core']);
export type BossType = z.infer<typeof BossTypeSchema>;

// ─── Wave entry ────────────────────────────────────────────────────────────────
export const WaveEntrySchema = z.object({
  tick: z.number().int().nonnegative(),
  enemy: EnemyTypeSchema,
  y: z.number(),
  path: PathIdSchema.optional(),
  count: z.number().int().positive().optional(),
  spacing: z.number().optional(),
  drop: CapsuleTypeSchema.nullable().optional(),
});
export type WaveEntry = z.infer<typeof WaveEntrySchema>;

// ─── Background layer ──────────────────────────────────────────────────────────
export const BackgroundLayerSchema = z.object({
  asset: z.string(),
  speed: z.number(),
});

// ─── Level data ────────────────────────────────────────────────────────────────
export const LevelDataSchema = z.object({
  id: z.string(),
  scrollSpeed: z.number().positive(),
  tileSize: z.literal(16),
  terrain: z.array(z.string()),
  waves: z.array(WaveEntrySchema),
  boss: z.object({
    tick: z.number().int().nonnegative(),
    type: BossTypeSchema,
  }),
  background: z.object({
    layers: z.array(BackgroundLayerSchema),
  }),
  music: z.string(),
  difficulty: DifficultySchema.optional(),
});
export type LevelData = z.infer<typeof LevelDataSchema>;

