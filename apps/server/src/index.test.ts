import supertest from 'supertest';
import { describe, expect, it } from 'vitest';
import { CORE_VERSION } from '@vanguarda/core';
import { buildServer } from './index';

describe('server ranking flow', () => {
  it('auths a player and accepts a valid replay-based score', async () => {
    const app = await buildServer();
    await app.ready();

    const authResponse = await supertest(app.server).post('/auth/anonymous').expect(201);
    const { playerId, token } = authResponse.body as { playerId: string; token: string };

    const replay = {
      coreVersion: CORE_VERSION,
      seed: 12345,
      levelId: 'world-1',
      difficulty: 'normal',
      inputs: [{ moveX: 0, moveY: 0, buttons: 0, repeat: 1 }],
    } as const;

    const submitResponse = await supertest(app.server)
      .post('/scores')
      .send({
        playerId,
        token,
        score: 0,
        replay,
      })
      .expect(201);

    expect(submitResponse.body.ok).toBe(true);
    expect(submitResponse.body.verifiedScore).toBe(0);

    const leaderboard = await supertest(app.server).get('/leaderboard').expect(200);
    expect(leaderboard.body.entries.length).toBeGreaterThan(0);
    expect(leaderboard.body.entries[0].score).toBe(0);
  });

  it('rejects a score that does not match the replay result', async () => {
    const app = await buildServer();
    await app.ready();

    const authResponse = await supertest(app.server).post('/auth/anonymous').expect(201);
    const { playerId, token } = authResponse.body as { playerId: string; token: string };

    const replay = {
      coreVersion: CORE_VERSION,
      seed: 789,
      levelId: 'world-2',
      difficulty: 'hard',
      inputs: [{ moveX: 0, moveY: 0, buttons: 0, repeat: 1 }],
    } as const;

    const response = await supertest(app.server)
      .post('/scores')
      .send({
        playerId,
        token,
        score: 42,
        replay,
      })
      .expect(409);

    expect(response.body.error).toBe('Replay validation failed.');
  });
});
