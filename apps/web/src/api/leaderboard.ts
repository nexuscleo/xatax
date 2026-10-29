export type ApiDifficulty = 'easy' | 'normal' | 'hard';

export type OnlineLeaderboardEntry = {
  id: string;
  playerId: string;
  name: string;
  score: number;
  levelId: string;
  difficulty: ApiDifficulty;
  createdAt: string;
};

export type AuthResponse = {
  playerId: string;
  token: string;
  name: string;
};

export type PlayerSession = AuthResponse;

export type ScoreSubmissionRequest = {
  playerId: string;
  token: string;
  score: number;
  playerName?: string;
  replay: {
    coreVersion: string;
    seed: number;
    levelId: string;
    difficulty: ApiDifficulty;
    inputs: Array<{ moveX: number; moveY: number; buttons: number; repeat: number }>;
  };
};

const SERVER_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VANGUARDA_SERVER_URL) ||
  'http://localhost:3001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${SERVER_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchOnlineLeaderboard(): Promise<OnlineLeaderboardEntry[]> {
  const payload = await request<{ entries: OnlineLeaderboardEntry[] }>('/leaderboard');
  return payload.entries ?? [];
}

export async function authenticateAnonymousPlayer(): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/anonymous', { method: 'POST' });
}

export async function submitScoreToServer(payload: ScoreSubmissionRequest): Promise<{ ok: boolean; rank: number; verifiedScore: number }> {
  return request<{ ok: boolean; rank: number; verifiedScore: number }>('/scores', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
