export type GameSettings = {
  musicVolume: number;
  sfxVolume: number;
  highContrast: boolean;
  reduceEffects: boolean;
};

export type ScoreEntry = {
  id: string;
  score: number;
  worldId: string;
  worldLabel: string;
  createdAt: string;
};

export type PlayerSession = {
  playerId: string;
  token: string;
  name: string;
};

export const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.18,
  sfxVolume: 0.35,
  highContrast: false,
  reduceEffects: false,
};

const SETTINGS_KEY = 'vanguarda.settings';
const LEADERBOARD_KEY = 'vanguarda.leaderboard';
const SESSION_KEY = 'vanguarda.playerSession';

export function loadSettings(): GameSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  const raw = window.localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadLeaderboard(): ScoreEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(LEADERBOARD_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return [...parsed]
      .filter((entry): entry is ScoreEntry => {
        if (!entry || typeof entry !== 'object') return false;
        const candidate = entry as Partial<ScoreEntry>;
        return (
          typeof candidate.id === 'string' &&
          typeof candidate.score === 'number' &&
          typeof candidate.worldId === 'string' &&
          typeof candidate.worldLabel === 'string' &&
          typeof candidate.createdAt === 'string'
        );
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, 8);
  } catch {
    return [];
  }
}

export function saveLeaderboardScore(
  score: number,
  worldId: string,
  worldLabel: string,
): ScoreEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const nextScores = [
    ...loadLeaderboard(),
    {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      score,
      worldId,
      worldLabel,
      createdAt: new Date().toISOString(),
    },
  ]
    .sort((left, right) => right.score - left.score)
    .slice(0, 8);

  window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(nextScores));
  return nextScores;
}

export function loadPlayerSession(): PlayerSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PlayerSession>;
    if (
      typeof parsed.playerId === 'string' &&
      typeof parsed.token === 'string' &&
      typeof parsed.name === 'string'
    ) {
      return {
        playerId: parsed.playerId,
        token: parsed.token,
        name: parsed.name,
      };
    }
  } catch {
    // Ignore invalid persisted session and fall back to a fresh login.
  }

  return null;
}

export function savePlayerSession(session: PlayerSession | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
