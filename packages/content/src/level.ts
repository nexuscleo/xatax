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
export const WaveEntrySchema = z
  .object({
    tick: z.number().int().nonnegative(),
    enemy: EnemyTypeSchema,
    y: z.number().min(0).max(270),
    path: PathIdSchema.optional(),
    count: z.number().int().positive().optional(),
    spacing: z.number().nonnegative().optional(),
    drop: CapsuleTypeSchema.nullable().optional(),
  })
  .superRefine((wave, context) => {
    const expectedPaths = {
      wave_drone: 'sine_wave',
      zigzag_drone: 'zigzag',
      squadron: 'squadron_arc',
    } as const;
    const expectedPath = expectedPaths[wave.enemy as keyof typeof expectedPaths];
    if (wave.path && expectedPath && wave.path !== expectedPath) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${wave.enemy} requires the ${expectedPath} trajectory`,
        path: ['path'],
      });
    }
  });
export type WaveEntry = z.infer<typeof WaveEntrySchema>;

// ─── Background layer ──────────────────────────────────────────────────────────
export const BackgroundLayerSchema = z.object({
  asset: z.string(),
  speed: z.number(),
});

// ─── Level data ────────────────────────────────────────────────────────────────
export const LevelDataSchema = z
  .object({
    id: z.string().min(1),
    scrollSpeed: z.number().positive(),
    tileSize: z.literal(16),
    terrain: z
      .array(z.string().regex(/^[.#]+$/))
      .min(3)
      .superRefine((terrain, context) => {
        const width = terrain[0]!.length;
        for (let i = 0; i < terrain.length; i++) {
          if (terrain[i]!.length !== width) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Terrain rows must have the same width',
              path: [i],
            });
          }
          if (!terrain[i]!.startsWith('#') || !terrain[i]!.endsWith('#')) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Terrain rows must be enclosed by solid tiles',
              path: [i],
            });
          }
        }
      }),
    waves: z.array(WaveEntrySchema).superRefine((waves, context) => {
      for (let i = 1; i < waves.length; i++) {
        if (waves[i]!.tick < waves[i - 1]!.tick) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Wave entries must be ordered by tick',
            path: [i, 'tick'],
          });
        }
      }
    }),
    boss: z.object({
      tick: z.number().int().nonnegative(),
      type: BossTypeSchema,
    }),
    background: z.object({
      layers: z.array(BackgroundLayerSchema).min(1),
    }),
    music: z.string().min(1),
    difficulty: DifficultySchema.optional(),
  })
  .superRefine((level, context) => {
    const lastWaveTick = level.waves.at(-1)?.tick ?? 0;
    if (level.boss.tick <= lastWaveTick) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Boss must spawn after the final wave',
        path: ['boss', 'tick'],
      });
    }
  });
export type LevelData = z.infer<typeof LevelDataSchema>;
