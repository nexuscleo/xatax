import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { config as loadEnv } from 'dotenv';
import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Database from 'better-sqlite3';
import { z } from 'zod';
import { CORE_VERSION, runReplay, type ReplayData } from '@vanguarda/core';

loadEnv();

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('*'),
});

const env = envSchema.parse(process.env);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'vanguarda.db'));
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    player_id TEXT PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(player_id) REFERENCES players(id)
  );

  CREATE TABLE IF NOT EXISTS saves (
    player_id TEXT PRIMARY KEY,
    payload TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(player_id) REFERENCES players(id)
  );

  CREATE TABLE IF NOT EXISTS leaderboard (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    level_id TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'normal', 'hard')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(player_id) REFERENCES players(id)
  );

  CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC, created_at DESC);
`);

const replayInputSchema = z.object({
  moveX: z.number().int(),
  moveY: z.number().int(),
  buttons: z.number().int(),
  repeat: z.number().int().min(1).default(1),
});

const replaySchema = z.object({
  coreVersion: z.string().min(1),
  seed: z.number().int(),
  levelId: z.string().min(1),
  difficulty: z.enum(['easy', 'normal', 'hard']),
  inputs: z.array(replayInputSchema).default([]),
});

const scoreSubmissionSchema = z.object({
  playerId: z.string().min(1),
  token: z.string().min(1),
  score: z.number().int().min(0),
  playerName: z.string().min(1).max(32).optional(),
  replay: replaySchema,
});

const savePayloadSchema = z.object({
  save: z.string().max(4000).optional(),
});

interface LeaderboardEntry {
  id: string;
  playerId: string;
  name: string;
  score: number;
  levelId: string;
  difficulty: 'easy' | 'normal' | 'hard';
  createdAt: string;
}

interface PlayerSession {
  playerId: string;
  name: string;
  token: string;
  save: string | null;
}

function buildPlayerName(): string {
  const adjectives = ['Vanguarda', 'Raptor', 'Estelar', 'Nexo', 'Fúria', 'Aster'];
  const nouns = ['Aviador', 'Guardião', 'Piloto', 'Patrulheiro', 'Caçador', 'Nave'];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)] ?? 'Vanguarda';
  const noun = nouns[Math.floor(Math.random() * nouns.length)] ?? 'Piloto';
  return `${adjective} ${noun}`;
}

function getSessionFromToken(token: string | undefined): PlayerSession | null {
  if (!token) {
    return null;
  }

  const row = db
    .prepare(
      `
        SELECT s.player_id AS playerId, p.name, s.token, COALESCE(save.payload, NULL) AS save
        FROM sessions s
        INNER JOIN players p ON p.id = s.player_id
        LEFT JOIN saves save ON save.player_id = p.id
        WHERE s.token = ?
      `,
    )
    .get(token) as
    | {
        playerId: string;
        name: string;
        token: string;
        save: string | null;
      }
    | undefined;

  return row ? { ...row, save: row.save ?? null } : null;
}

function validateReplayScore(replay: ReplayData, expectedScore: number): { valid: boolean; verifiedScore: number; reason?: string } {
  if (replay.coreVersion !== CORE_VERSION) {
    return {
      valid: false,
      verifiedScore: 0,
      reason: `Unsupported core version: expected ${CORE_VERSION}, got ${replay.coreVersion}`,
    };
  }

  try {
    const verified = runReplay(replay);
    if (verified.finalScore !== expectedScore) {
      return {
        valid: false,
        verifiedScore: verified.finalScore,
        reason: `Declared score mismatch: expected ${expectedScore}, replay resolved to ${verified.finalScore}`,
      };
    }

    return {
      valid: true,
      verifiedScore: verified.finalScore,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown replay validation failure';
    return {
      valid: false,
      verifiedScore: 0,
      reason: message,
    };
  }
}

export async function buildServer() {
  const app = Fastify({
    logger: false,
    requestTimeout: 15000,
    bodyLimit: 262144,
  });

  await app.register(fastifyHelmet, { global: true });
  await app.register(fastifyCors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((value) => value.trim()),
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 60,
    timeWindow: '1 minute',
    nameSpace: 'vanguarda',
    skipOnError: true,
    keyGenerator: (request) => request.ip ?? 'anonymous',
  });

  app.get('/health', async () => ({ status: 'ok', coreVersion: CORE_VERSION }));

  app.post('/auth/anonymous', async (_request, reply) => {
    const playerId = crypto.randomUUID();
    const token = crypto.randomBytes(24).toString('hex');
    const name = buildPlayerName();

    db.prepare('INSERT INTO players (id, name) VALUES (?, ?)').run(playerId, name);
    db.prepare('INSERT INTO sessions (player_id, token) VALUES (?, ?)').run(playerId, token);
    db.prepare('INSERT INTO saves (player_id, payload) VALUES (?, NULL)').run(playerId);

    return reply.code(201).send({
      playerId,
      token,
      name,
    });
  });

  app.get('/leaderboard', async () => {
    const entries = db
      .prepare(
        `
          SELECT id, player_id AS playerId, player_name AS name, score, level_id AS levelId, difficulty, created_at AS createdAt
          FROM leaderboard
          ORDER BY score DESC, created_at DESC
          LIMIT 10
        `,
      )
      .all() as Array<LeaderboardEntry>;

    return { entries };
  });

  app.get('/me/save', async (request, reply) => {
    const authHeader = request.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const session = getSessionFromToken(token);

    if (!session) {
      return reply.code(401).send({ error: 'Missing or invalid session token.' });
    }

    const row = db
      .prepare('SELECT payload FROM saves WHERE player_id = ?')
      .get(session.playerId) as { payload: string | null } | undefined;

    return { save: row?.payload ?? null };
  });

  app.put('/me/save', async (request, reply) => {
    const authHeader = request.headers.authorization ?? '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const session = getSessionFromToken(token);

    if (!session) {
      return reply.code(401).send({ error: 'Missing or invalid session token.' });
    }

    const parsed = savePayloadSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid save payload.', details: parsed.error.flatten() });
    }

    db.prepare('INSERT INTO saves (player_id, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(player_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at')
      .run(session.playerId, parsed.data.save ?? null, new Date().toISOString());

    return { ok: true, save: parsed.data.save ?? null };
  });

  app.post('/scores', async (request, reply) => {
    const parsed = scoreSubmissionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid score payload.', details: parsed.error.flatten() });
    }

    const { playerId, token, score, playerName, replay } = parsed.data;
    const session = getSessionFromToken(token);
    if (!session || session.playerId !== playerId) {
      return reply.code(401).send({ error: 'Session token does not match player.' });
    }

    const validation = validateReplayScore(replay, score);
    if (!validation.valid) {
      return reply.code(409).send({
        error: 'Replay validation failed.',
        reason: validation.reason ?? 'Score does not match replay output.',
        verifiedScore: validation.verifiedScore,
      });
    }

    const entryId = crypto.randomUUID();
    const name = playerName ?? session.name;
    db.prepare(
      `
        INSERT INTO leaderboard (id, player_id, player_name, score, level_id, difficulty, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(entryId, playerId, name, score, replay.levelId, replay.difficulty, new Date().toISOString());

    const ordered = db
      .prepare(
        `
          SELECT id, player_id AS playerId, player_name AS name, score, level_id AS levelId, difficulty, created_at AS createdAt
          FROM leaderboard
          ORDER BY score DESC, created_at DESC
        `,
      )
      .all() as Array<LeaderboardEntry>;

    const rank = ordered.findIndex((entry) => entry.id === entryId) + 1;

    return reply.code(201).send({
      ok: true,
      entry: {
        id: entryId,
        playerId,
        name,
        score,
        levelId: replay.levelId,
        difficulty: replay.difficulty,
        createdAt: new Date().toISOString(),
      },
      verifiedScore: validation.verifiedScore,
      rank,
    });
  });

  return app;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const app = await buildServer();
  await app.listen({ port: env.PORT, host: env.HOST });
  console.info(`Vanguarda server listening on http://${env.HOST}:${env.PORT}`);
}
