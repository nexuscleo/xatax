import React, { useEffect, useState } from 'react';
import {
  authenticateAnonymousPlayer,
  fetchOnlineLeaderboard,
  type OnlineLeaderboardEntry,
} from './api/leaderboard';
import { GameView } from './components/GameView';
import {
  loadLeaderboard,
  loadPlayerSession,
  loadSettings,
  savePlayerSession,
  saveSettings,
  type GameSettings,
  type PlayerSession,
  type ScoreEntry,
} from './storage/gameData';

const WORLD_OPTIONS = [
  { id: 'world-1', label: 'Mundo 1 · Docas' },
  { id: 'world-2', label: 'Mundo 2 · Reatores' },
  { id: 'world-3', label: 'Mundo 3 · Núcleo' },
] as const;

type SettingsPanelProps = {
  settings: GameSettings;
  onChange: (next: GameSettings) => void;
  onClose: () => void;
};

type CreditsPanelProps = {
  onClose: () => void;
};

const CreditsPanel: React.FC<CreditsPanelProps> = ({ onClose }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Créditos do jogo"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(1, 4, 9, 0.84)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: 'min(560px, 100%)',
          backgroundColor: '#0d1117',
          border: '1px solid #30363d',
          borderRadius: '18px',
          padding: '1.5rem',
          boxShadow: '0 30px 100px rgba(0,0,0,0.52)',
          color: '#f0f6fc',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Créditos</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid #30363d',
              backgroundColor: '#161b22',
              color: '#f0f6fc',
              borderRadius: '8px',
              padding: '0.5rem 0.8rem',
              cursor: 'pointer',
            }}
          >
            Fechar
          </button>
        </div>

        <div style={{ display: 'grid', gap: '1rem', color: '#c9d1d9' }}>
          <p style={{ margin: 0 }}>
            <strong style={{ color: '#f0f6fc' }}>Vanguarda</strong> é uma proposta original de jogo horizontal
            arcade com cenário orbital e três mundos.
          </p>
          <div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#f0f6fc' }}>Equipe</h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.7 }}>
              <li>Design do jogo e direção de arte: projeto Vanguarda</li>
              <li>Programação: arquitetura core + UI web</li>
              <li>Áudio procedural: Web Audio API</li>
            </ul>
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#f0f6fc' }}>Licenças</h3>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.7 }}>
              <li>Código: MIT / projeto interno</li>
              <li>Áudio: procedural, sem terceiros</li>
              <li>Arte: placeholders geométricos e sprites gerados em código</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onChange, onClose }) => {
  const update = <K extends keyof GameSettings>(key: K, value: GameSettings[K]): void => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Configurações do jogo"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(1, 4, 9, 0.84)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 50,
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: 'min(560px, 100%)',
          backgroundColor: '#0d1117',
          border: '1px solid #30363d',
          borderRadius: '18px',
          padding: '1.5rem',
          boxShadow: '0 30px 100px rgba(0,0,0,0.52)',
          color: '#f0f6fc',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Configurações</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid #30363d',
              backgroundColor: '#161b22',
              color: '#f0f6fc',
              borderRadius: '8px',
              padding: '0.5rem 0.8rem',
              cursor: 'pointer',
            }}
          >
            Fechar
          </button>
        </div>

        <div style={{ display: 'grid', gap: '1.25rem' }}>
          <label style={{ display: 'grid', gap: '0.45rem' }}>
            <span style={{ color: '#c9d1d9', fontSize: '0.9rem' }}>Volume da música</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.musicVolume}
              onChange={(event) => update('musicVolume', Number(event.target.value))}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.45rem' }}>
            <span style={{ color: '#c9d1d9', fontSize: '0.9rem' }}>Volume dos efeitos</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.sfxVolume}
              onChange={(event) => update('sfxVolume', Number(event.target.value))}
            />
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid #30363d',
              borderRadius: '10px',
              padding: '0.75rem 0.9rem',
            }}
          >
            <span>Alto contraste</span>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(event) => update('highContrast', event.target.checked)}
            />
          </label>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: '1px solid #30363d',
              borderRadius: '10px',
              padding: '0.75rem 0.9rem',
            }}
          >
            <span>Reduzir efeitos visuais</span>
            <input
              type="checkbox"
              checked={settings.reduceEffects}
              onChange={(event) => update('reduceEffects', event.target.checked)}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [selectedWorld, setSelectedWorld] = useState<(typeof WORLD_OPTIONS)[number]['id']>('world-2');
  const [started, setStarted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>(() => loadLeaderboard());
  const [playerSession, setPlayerSession] = useState<PlayerSession | null>(() => loadPlayerSession());
  const [onlineLeaderboard, setOnlineLeaderboard] = useState<OnlineLeaderboardEntry[]>([]);

  useEffect(() => {
    if (!playerSession) {
      authenticateAnonymousPlayer()
        .then((session) => setPlayerSession(session))
        .catch(() => {
          // Server may be offline; the local flow still works without online ranking.
        });
      return;
    }

    savePlayerSession(playerSession);
  }, [playerSession]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    setLeaderboard(loadLeaderboard());
  }, [started]);

  useEffect(() => {
    fetchOnlineLeaderboard()
      .then((entries) => setOnlineLeaderboard(entries))
      .catch(() => setOnlineLeaderboard([]));
  }, []);

  const menuBackground = settings.highContrast
    ? 'radial-gradient(circle at top, #0f172a 0%, #020617 60%, #01060c 100%)'
    : 'radial-gradient(circle at top, #1d2d3f 0%, #0d1117 62%, #05080b 100%)';

  if (!started) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: menuBackground,
          padding: '2rem',
          color: '#f0f6fc',
          filter: settings.highContrast ? 'contrast(1.2)' : 'none',
        }}
      >
        {settingsOpen && (
          <SettingsPanel settings={settings} onChange={setSettings} onClose={() => setSettingsOpen(false)} />
        )}

        {creditsOpen && <CreditsPanel onClose={() => setCreditsOpen(false)} />}

        <section
          style={{
            width: 'min(780px, 100%)',
            backgroundColor: 'rgba(13, 17, 23, 0.9)',
            border: settings.highContrast ? '1px solid #f0f6fc' : '1px solid #30363d',
            borderRadius: '18px',
            boxShadow: '0 0 0 1px rgba(88,166,255,0.15), 0 25px 80px rgba(0,0,0,0.45)',
            padding: '2rem',
          }}
        >
          <header style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <p style={{ color: '#ff9f43', letterSpacing: '0.35rem', fontSize: '0.72rem', margin: 0 }}>
              FATIA VERTICAL
            </p>
            <h1 style={{ margin: '0.75rem 0 0.25rem', fontSize: 'clamp(2.5rem, 5vw, 4rem)', letterSpacing: '0.2rem' }}>
              VANGUARDA
            </h1>
            <p style={{ margin: 0, color: '#8b949e', fontSize: '0.9rem' }}>
              Defenda a estação orbital da IA rebelde.
            </p>
          </header>

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '1.5rem' }}>
            <div>
              {playerSession ? (
                <p style={{ margin: '0 0 1rem', color: '#c9d1d9' }}>
                  Jogador: <strong style={{ color: '#79f0ff' }}>{playerSession.name}</strong>
                </p>
              ) : (
                <p style={{ margin: '0 0 1rem', color: '#8b949e' }}>Conectando ao ranking online…</p>
              )}
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ color: '#8b949e', margin: '0 0 0.75rem', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.12rem' }}>
                  Seleção de mundo
                </p>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {WORLD_OPTIONS.map((world) => {
                    const isActive = selectedWorld === world.id;
                    return (
                      <button
                        key={world.id}
                        type="button"
                        onClick={() => setSelectedWorld(world.id)}
                        aria-pressed={isActive}
                        style={{
                          width: '100%',
                          padding: '0.9rem 1rem',
                          borderRadius: '10px',
                          border: isActive ? '1px solid #ff9f43' : '1px solid #30363d',
                          backgroundColor: isActive ? 'rgba(255,159,67,0.12)' : '#0d1117',
                          color: isActive ? '#ffd3a3' : '#f0f6fc',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          fontWeight: 600,
                        }}
                      >
                        {world.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setStarted(true)}
                  style={{
                    flex: '1 1 220px',
                    padding: '1rem 1.25rem',
                    border: 'none',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ff9f43 0%, #f85149 100%)',
                    color: '#0d1117',
                    fontWeight: 800,
                    fontSize: '1rem',
                    letterSpacing: '0.08rem',
                    cursor: 'pointer',
                  }}
                >
                  INICIAR PARTIDA
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  style={{
                    flex: '1 1 160px',
                    padding: '1rem 1.25rem',
                    border: '1px solid #30363d',
                    borderRadius: '12px',
                    backgroundColor: '#161b22',
                    color: '#f0f6fc',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  CONFIGURAÇÕES
                </button>
                <button
                  type="button"
                  onClick={() => setCreditsOpen(true)}
                  style={{
                    flex: '1 1 140px',
                    padding: '1rem 1.25rem',
                    border: '1px solid #30363d',
                    borderRadius: '12px',
                    backgroundColor: '#0d1117',
                    color: '#f0f6fc',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  CRÉDITOS
                </button>
              </div>
            </div>

            <aside
              style={{
                border: '1px solid #30363d',
                borderRadius: '12px',
                backgroundColor: '#0d1117',
                padding: '1rem',
              }}
            >
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.75rem', color: '#8b949e', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12rem' }}>
                  Ranking local
                </p>

                {leaderboard.length === 0 ? (
                  <p style={{ margin: 0, color: '#8b949e' }}>Nenhuma pontuação salva ainda.</p>
                ) : (
                  <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '0.6rem' }}>
                    {leaderboard.map((entry) => (
                      <li key={entry.id} style={{ color: '#f0f6fc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <span style={{ color: '#c9d1d9' }}>{entry.worldLabel}</span>
                          <strong style={{ color: '#ff9f43' }}>{entry.score.toLocaleString()}</strong>
                        </div>
                        <small style={{ color: '#8b949e' }}>
                          {new Date(entry.createdAt).toLocaleDateString('pt-BR')}
                        </small>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div>
                <p style={{ margin: '0 0 0.75rem', color: '#8b949e', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12rem' }}>
                  Ranking online
                </p>
                {onlineLeaderboard.length === 0 ? (
                  <p style={{ margin: 0, color: '#8b949e' }}>Servidor indisponível.</p>
                ) : (
                  <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '0.5rem' }}>
                    {onlineLeaderboard.slice(0, 5).map((entry) => (
                      <li key={entry.id} style={{ color: '#f0f6fc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <span style={{ color: '#c9d1d9' }}>{entry.name}</span>
                          <strong style={{ color: '#79f0ff' }}>{entry.score.toLocaleString()}</strong>
                        </div>
                        <small style={{ color: '#8b949e' }}>{entry.levelId}</small>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </aside>
          </div>
        </section>
      </main>
    );
  }

  return (
    <GameView
      worldId={selectedWorld}
      onBackToMenu={() => setStarted(false)}
      settings={settings}
      onSettingsChange={setSettings}
      playerSession={playerSession ?? undefined}
    />
  );
};
