import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  CORE_VERSION,
  compressInputs,
  type World,
  createWorld,
  playGameEvents,
  step,
  STEP,
  UiStore,
} from '@vanguarda/core';
import { balance } from '@vanguarda/content';
import { CanvasRenderer } from '../canvas/CanvasRenderer';
import { InputManager } from '../input/InputManager';
import { WebAudioPlayer } from '../audio/WebAudioPlayer';
import { submitScoreToServer, type PlayerSession } from '../api/leaderboard';
import type { CapsuleType } from '@vanguarda/content';
import {
  DEFAULT_SETTINGS,
  loadLeaderboard,
  saveLeaderboardScore,
  type GameSettings,
  type ScoreEntry,
} from '../storage/gameData';

const DEFAULT_WORLD_ID = 'world-2';

type WorldTheme = {
  label: string;
  accent: string;
  background: string;
  terrain: string;
  border: string;
  starA: string;
  starB: string;
  bossLabel: string;
  bossPrimary: string;
  bossSecondary: string;
  bossAccent: string;
};

const WORLD_THEMES: Readonly<Record<string, WorldTheme>> = {
  'world-1': {
    label: 'Mundo 1 · Docas',
    accent: '#58a6ff',
    background: '#0d1117',
    terrain: '#21262d',
    border: '#30363d',
    starA: '#58a6ff',
    starB: '#8b949e',
    bossLabel: 'GUARDIÃO DAS DOCAS',
    bossPrimary: '#8b1e2d',
    bossSecondary: '#da3633',
    bossAccent: '#ffa657',
  },
  'world-2': {
    label: 'Mundo 2 · Reatores',
    accent: '#ff9f43',
    background: '#120d0d',
    terrain: '#3a2619',
    border: '#815530',
    starA: '#ffb454',
    starB: '#ffd166',
    bossLabel: 'SENTINELA DO REATOR',
    bossPrimary: '#7a1d1d',
    bossSecondary: '#ff6a3d',
    bossAccent: '#ffdd44',
  },
  'world-3': {
    label: 'Mundo 3 · Núcleo',
    accent: '#b784ff',
    background: '#0d1117',
    terrain: '#1d142d',
    border: '#4b2d72',
    starA: '#b784ff',
    starB: '#79f0ff',
    bossLabel: 'NÚCLEO DA IA',
    bossPrimary: '#35174f',
    bossSecondary: '#8b5cf6',
    bossAccent: '#7ee787',
  },
};

const CAPSULE_VISUALS: Readonly<Record<CapsuleType, { letter: string; color: string }>> = {
  weapon: { letter: 'W', color: '#58a6ff' },
  missile: { letter: 'M', color: '#bc8cff' },
  shield: { letter: 'E', color: '#3fb950' },
  speed: { letter: 'V', color: '#d29922' },
  bomb: { letter: 'B', color: '#f85149' },
  life: { letter: '+', color: '#f778ba' },
  points: { letter: 'P', color: '#ffa657' },
};

const getWorldTheme = (levelId: string): WorldTheme => {
  const theme = (WORLD_THEMES as Record<string, WorldTheme | undefined>)[levelId];
  return (theme ?? WORLD_THEMES['world-1']) as WorldTheme;
};

type GameViewProps = {
  worldId?: string;
  onBackToMenu?: () => void;
  settings?: GameSettings;
  onSettingsChange?: (next: GameSettings) => void;
  playerSession?: PlayerSession;
};

export const GameView: React.FC<GameViewProps> = ({
  worldId = DEFAULT_WORLD_ID,
  onBackToMenu,
  settings = DEFAULT_SETTINGS,
  onSettingsChange,
  playerSession,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [uiStore] = useState(() => new UiStore('playing'));
  const snapshot = useSyncExternalStore(uiStore.subscribe, uiStore.getSnapshot);
  const scoreRecordedRef = useRef(false);
  const inputHistoryRef = useRef<Array<{ moveX: number; moveY: number; buttons: number }>>([]);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>(() => loadLeaderboard());
  const [settingsOpen, setSettingsOpen] = useState(false);

  const worldRef = useRef<World>(createWorld(Date.now(), worldId));
  const audioPlayerRef = useRef<WebAudioPlayer | null>(null);
  const worldTheme = getWorldTheme(worldRef.current.levelData.id);

  const [fps, setFps] = useState(60);
  const [audioStatus, setAudioStatus] = useState('O áudio começa após sua primeira interação.');

  const restartGame = (): void => {
    scoreRecordedRef.current = false;
    inputHistoryRef.current = [];
    worldRef.current = createWorld(Date.now(), worldId);
    uiStore.update(worldRef.current, 'playing');
    audioPlayerRef.current?.playMusic(worldRef.current.levelData.music);
    setLeaderboard(loadLeaderboard());
  };

  useEffect(() => {
    scoreRecordedRef.current = false;
    inputHistoryRef.current = [];
    worldRef.current = createWorld(Date.now(), worldId);
    uiStore.update(worldRef.current, 'playing');
    audioPlayerRef.current?.playMusic(worldRef.current.levelData.music);
    setLeaderboard(loadLeaderboard());
  }, [uiStore, worldId]);

  useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.setVolume('music', settings.musicVolume);
      audioPlayerRef.current.setVolume('sfx', settings.sfxVolume);
    }
  }, [settings.musicVolume, settings.sfxVolume]);

  useEffect(() => {
    if ((snapshot.state === 'gameover' || snapshot.state === 'worldClear') && !scoreRecordedRef.current) {
      const nextLeaderboard = saveLeaderboardScore(snapshot.score, worldId, getWorldTheme(worldId).label);
      setLeaderboard(nextLeaderboard);

      if (playerSession) {
        const replayPayload = {
          coreVersion: CORE_VERSION,
          seed: worldRef.current.seed,
          levelId: worldRef.current.levelData.id,
          difficulty: worldRef.current.difficulty,
          inputs: compressInputs(inputHistoryRef.current),
        };

        void submitScoreToServer({
          playerId: playerSession.playerId,
          token: playerSession.token,
          score: snapshot.score,
          playerName: playerSession.name,
          replay: replayPayload,
        }).catch((error: unknown) => {
          console.error('Não foi possível enviar a pontuação para o ranking online.', error);
        });
      }

      scoreRecordedRef.current = true;
    }

    if (snapshot.state === 'playing' || snapshot.state === 'paused') {
      scoreRecordedRef.current = false;
    }
  }, [playerSession, snapshot.score, snapshot.state, worldId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new CanvasRenderer(canvas);
    const inputManager = new InputManager();
    const audioPlayer = new WebAudioPlayer();
    audioPlayerRef.current = audioPlayer;
    let audioStarted = false;
    let audioStartPromise: Promise<void> | null = null;
    const startAudio = (): void => {
      if (audioStartPromise) return;
      audioStartPromise = (async () => {
        try {
          await audioPlayer.start();
          audioStarted = true;
          setAudioStatus('Áudio ativo.');
          if (uiStore.getSnapshot().state === 'playing') {
            audioPlayer.playMusic(worldRef.current.levelData.music);
          }
        } catch (error) {
          audioStartPromise = null;
          const message = error instanceof Error ? error.message : String(error);
          setAudioStatus(`Áudio indisponível: ${message}`);
          console.error('Não foi possível iniciar o áudio do jogo.', error);
        }
      })();
    };
    const handleUserInteraction = (): void => startAudio();
    const stopGame = (): void => {
      uiStore.setState('paused');
      audioPlayer.stopMusic();
    };
    const handlePauseKey = (event: KeyboardEvent): void => {
      if (event.code !== 'KeyP' && event.code !== 'Escape') return;
      event.preventDefault();
      if (event.repeat) return;
      startAudio();

      const state = uiStore.getSnapshot().state;
      if (state === 'playing') {
        stopGame();
      } else if (state === 'paused') {
        uiStore.setState('playing');
        audioPlayer.playMusic(worldRef.current.levelData.music);
      }
    };
    const handleVisibilityChange = (): void => {
      if (document.hidden && uiStore.getSnapshot().state === 'playing') stopGame();
    };
    window.addEventListener('pointerdown', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('keydown', handlePauseKey);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    let acc = 0;
    let lastTime = performance.now();
    let frameId: number;
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const loop = (now: number): void => {
      const dt = Math.min((now - lastTime) / 1000, 0.25);
      lastTime = now;
      acc += dt;

      // Fixed step physics
      const world = worldRef.current;
      if (uiStore.getSnapshot().state === 'playing') {
        while (acc >= STEP) {
          const input = inputManager.getInput();
          inputHistoryRef.current.push({
            moveX: input.moveX,
            moveY: input.moveY,
            buttons: input.buttons,
          });
          step(world, input);
          if (audioStarted) {
            playGameEvents(world.events, audioPlayer);
            if (world.state !== 'playing') audioPlayer.stopMusic();
          }
          acc -= STEP;
        }
      } else {
        acc = 0;
      }

      audioPlayer.updateMusic();

      if (world.tick % 6 === 0 || world.state !== 'playing') {
        uiStore.update(world, uiStore.getSnapshot().state);
      }

      // Rendering with alpha interpolation
      const alpha = acc / STEP;
      renderScene(renderer, world, alpha);

      // FPS tracking
      frameCount++;
      if (now - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
      inputManager.destroy();
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('keydown', handlePauseKey);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (audioPlayerRef.current === audioPlayer) audioPlayerRef.current = null;
      void audioPlayer.dispose().catch((error: unknown) => {
        console.error('Não foi possível liberar o áudio do jogo.', error);
      });
    };
  }, [uiStore]);

  const togglePause = (): void => {
    if (snapshot.state === 'playing') {
      uiStore.setState('paused');
      audioPlayerRef.current?.stopMusic();
    } else if (snapshot.state === 'paused') {
      uiStore.setState('playing');
      audioPlayerRef.current?.playMusic(worldRef.current.levelData.music);
    }
  };
  const isOverlayVisible =
    snapshot.state === 'paused' || snapshot.state === 'worldClear' || snapshot.state === 'gameover';
  const bossHealthPercent =
    snapshot.bossHp !== null && snapshot.bossMaxHp !== null && snapshot.bossMaxHp > 0
      ? Math.max(0, Math.min(100, (snapshot.bossHp / snapshot.bossMaxHp) * 100))
      : null;
  const updateGameSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]): void => {
    if (onSettingsChange) {
      onSettingsChange({ ...settings, [key]: value });
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        filter: settings.highContrast ? 'contrast(1.2)' : 'none',
        transition: settings.reduceEffects ? 'none' : 'filter 180ms ease',
      }}
    >
      {settingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Configurações do jogo"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 12, 0.8)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 60,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              width: 'min(520px, 100%)',
              backgroundColor: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: '18px',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#f0f6fc' }}>Configurações</h3>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                style={{
                  border: '1px solid #30363d',
                  backgroundColor: '#161b22',
                  color: '#f0f6fc',
                  borderRadius: '8px',
                  padding: '0.4rem 0.7rem',
                  cursor: 'pointer',
                }}
              >
                Fechar
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <label style={{ display: 'grid', gap: '0.35rem' }}>
                <span style={{ color: '#c9d1d9' }}>Volume da música</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.musicVolume}
                  onChange={(event) => updateGameSetting('musicVolume', Number(event.target.value))}
                />
              </label>

              <label style={{ display: 'grid', gap: '0.35rem' }}>
                <span style={{ color: '#c9d1d9' }}>Volume dos efeitos</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.sfxVolume}
                  onChange={(event) => updateGameSetting('sfxVolume', Number(event.target.value))}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #30363d',
                  borderRadius: '8px',
                  color: '#f0f6fc',
                }}
              >
                <span>Alto contraste</span>
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(event) => updateGameSetting('highContrast', event.target.checked)}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #30363d',
                  borderRadius: '8px',
                  color: '#f0f6fc',
                }}
              >
                <span>Reduzir efeitos visuais</span>
                <input
                  type="checkbox"
                  checked={settings.reduceEffects}
                  onChange={(event) => updateGameSetting('reduceEffects', event.target.checked)}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Top HUD */}
      <header
        style={{
          width: '960px',
          maxWidth: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem 1rem',
          padding: '0.5rem 1rem',
          backgroundColor: '#161b22',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          border: '1px solid #30363d',
          borderBottom: 'none',
          fontSize: '0.9rem',
          fontFamily: 'monospace',
        }}
      >
        <div>
          <span style={{ color: '#8b949e' }}>PONTOS: </span>
          <strong style={{ color: '#58a6ff' }}>{snapshot.score.toLocaleString()}</strong>
        </div>
        <div>
          <span style={{ color: '#8b949e' }}>VIDAS: </span>
          <strong style={{ color: snapshot.lives > 1 ? '#3fb950' : '#f85149' }}>
            {snapshot.lives}
          </strong>
        </div>
        <div>
          <span style={{ color: '#8b949e' }}>COMBO: </span>
          <strong style={{ color: '#d29922' }}>x{snapshot.combo}</strong>
        </div>
        <div>
          <span style={{ color: '#8b949e' }}>ARMA: </span>
          <strong style={{ color: '#bc8cff' }}>Nv.{snapshot.weaponLevel}</strong>
        </div>
        <div>
          <span style={{ color: '#8b949e' }}>ESCUDO: </span>
          <strong style={{ color: snapshot.shield > 0 ? '#3fb950' : '#8b949e' }}>
            {snapshot.shield > 0 ? 'ATIVO' : '—'}
          </strong>
        </div>
        <div>
          <span style={{ color: '#8b949e' }}>BOMBAS: </span>
          <strong style={{ color: '#ffa657' }}>{snapshot.bombs}</strong>
        </div>
        <div>
          <span style={{ color: '#8b949e' }}>FPS: </span>
          <strong style={{ color: fps >= 55 ? '#3fb950' : '#d29922' }}>{fps}</strong>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            style={{
              padding: '0.3rem 0.65rem',
              color: '#f0f6fc',
              backgroundColor: '#161b22',
              border: '1px solid #484f58',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Config
          </button>
          {onBackToMenu && (
            <button
              type="button"
              onClick={onBackToMenu}
              style={{
                padding: '0.3rem 0.65rem',
                color: '#f0f6fc',
                backgroundColor: '#161b22',
                border: '1px solid #484f58',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Menu
            </button>
          )}
          <button
            type="button"
            onClick={togglePause}
            disabled={snapshot.state !== 'playing' && snapshot.state !== 'paused'}
            aria-pressed={snapshot.state === 'paused'}
            style={{
              padding: '0.3rem 0.65rem',
              color: '#f0f6fc',
              backgroundColor: '#30363d',
              border: '1px solid #484f58',
              borderRadius: '4px',
              cursor:
                snapshot.state === 'playing' || snapshot.state === 'paused'
                  ? 'pointer'
                  : 'not-allowed',
            }}
          >
            {snapshot.state === 'paused' ? 'Retomar' : 'Pausar'}
          </button>
        </div>
      </header>
      <div
        role="status"
        aria-live="polite"
        style={{
          width: '960px',
          maxWidth: '100%',
          color: '#8b949e',
          fontSize: '0.75rem',
          padding: '0.25rem 0.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '0.75rem',
          alignItems: 'center',
        }}
      >
        <span>{audioStatus}</span>
        <span style={{ color: worldTheme.accent, fontWeight: 700 }}>{worldTheme.label}</span>
      </div>

      {/* Game Canvas Container */}
      <div
        style={{
          position: 'relative',
          width: '960px',
          maxWidth: '100%',
          aspectRatio: '16/9',
          backgroundColor: '#000',
          border: '1px solid #30363d',
        }}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

        {bossHealthPercent !== null && (
          <div
            style={{
              position: 'absolute',
              top: '0.75rem',
              left: '12%',
              right: '12%',
              color: '#f0f6fc',
              fontFamily: 'monospace',
              textAlign: 'center',
              textShadow: '0 1px 3px #000',
            }}
          >
            <div style={{ marginBottom: '0.25rem', fontSize: '0.75rem' }}>{worldTheme.bossLabel}</div>
            <div
              role="progressbar"
              aria-label="Vida do chefe"
              aria-valuemin={0}
              aria-valuemax={snapshot.bossMaxHp ?? 0}
              aria-valuenow={snapshot.bossHp ?? 0}
              style={{ height: '0.65rem', backgroundColor: '#30363d', border: '1px solid #8b949e' }}
            >
              <div
                style={{
                  width: `${bossHealthPercent}%`,
                  height: '100%',
                  backgroundColor: '#f85149',
                  transition: 'width 100ms linear',
                }}
              />
            </div>
          </div>
        )}

        {isOverlayVisible && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-overlay-title"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
            }}
          >
            <h2
              id="game-overlay-title"
              style={{
                color: snapshot.state === 'gameover' ? '#f85149' : '#58a6ff',
                fontSize: '2rem',
              }}
            >
              {snapshot.state === 'paused'
                ? 'PAUSADO'
                : snapshot.state === 'worldClear'
                  ? 'SETOR CONCLUÍDO'
                  : 'FIM DE JOGO'}
            </h2>
            {snapshot.state !== 'paused' && (
              <>
                <p style={{ color: '#8b949e' }}>
                  Pontuação:{' '}
                  <strong style={{ color: '#fff' }}>{snapshot.score.toLocaleString()}</strong>
                </p>
                <div style={{ display: 'grid', gap: '0.35rem', width: 'min(360px, 90%)' }}>
                  {leaderboard.slice(0, 3).map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: '#f0f6fc',
                        padding: '0.4rem 0.7rem',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(22, 27, 34, 0.75)',
                      }}
                    >
                      <span>{entry.worldLabel}</span>
                      <strong>{entry.score.toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {snapshot.state === 'paused' ? (
                <button
                  type="button"
                  onClick={togglePause}
                  style={{
                    padding: '0.6rem 1.4rem',
                    backgroundColor: '#238636',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Retomar partida
                </button>
              ) : (
                <button
                  type="button"
                  onClick={restartGame}
                  style={{
                    padding: '0.6rem 1.4rem',
                    backgroundColor: '#238636',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Jogar novamente
                </button>
              )}

              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                style={{
                  padding: '0.6rem 1.2rem',
                  backgroundColor: '#30363d',
                  color: '#fff',
                  border: '1px solid #484f58',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Configurações
              </button>

              {onBackToMenu && (
                <button
                  type="button"
                  onClick={onBackToMenu}
                  style={{
                    padding: '0.6rem 1.2rem',
                    backgroundColor: '#161b22',
                    color: '#fff',
                    border: '1px solid #484f58',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  Menu principal
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls legend */}
      <footer
        style={{
          width: '960px',
          maxWidth: '100%',
          padding: '0.6rem 1rem',
          backgroundColor: '#0d1117',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
          border: '1px solid #30363d',
          borderTop: 'none',
          fontSize: '0.8rem',
          color: '#8b949e',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>
          <strong>Mover:</strong> Setas ou WASD | <strong>Atirar:</strong> Espaço ou Z |{' '}
          <strong>Bomba:</strong> X | <strong>Pausar:</strong> P ou Esc
        </span>
        <span>Suporte a Gamepad ativo</span>
      </footer>
    </div>
  );
};

function renderScene(renderer: CanvasRenderer, world: World, alpha: number): void {
  const logicalW = balance.world.logicalWidth;
  const logicalH = balance.world.logicalHeight;
  const tileSize = balance.world.tileSize;
  const theme = getWorldTheme(world.levelData.id);

  renderer.begin(logicalW, logicalH);
  renderer.drawRect(0, 0, logicalW, logicalH, theme.background);

  // 1. Draw starfield background (deterministic based on scrollX)
  const offset = Math.floor(world.scrollX * 0.4) % logicalW;
  for (let s = 0; s < 40; s++) {
    const starX = (s * 37 - offset + logicalW * 2) % logicalW;
    const starY = ((s * 29) % (logicalH - 40)) + 20;
    renderer.drawRect(starX, starY, 1, 1, s % 2 === 0 ? theme.starA : theme.starB);
  }

  // 2. Draw terrain tiles
  const startCol = Math.max(0, Math.floor(world.scrollX / tileSize));
  const endCol = Math.min(
    world.terrainWidthTiles - 1,
    Math.ceil((world.scrollX + logicalW) / tileSize),
  );

  for (let r = 0; r < world.terrainHeightTiles; r++) {
    const row = world.terrain[r];
    if (!row) continue;
    for (let c = startCol; c <= endCol; c++) {
      if (row[c] === 1) {
        const screenX = c * tileSize - world.scrollX;
        const screenY = r * tileSize;
        renderer.drawRect(screenX, screenY, tileSize, tileSize, theme.terrain);
        // Border highlight
        renderer.drawRect(screenX, screenY, tileSize, 1, theme.border);
      }
    }
  }

  // 3. Draw enemies using distinct shapes, not only distinct colors.
  for (let i = 0; i < world.enemies.activeCount; i++) {
    const enemy = world.enemies.items[i];
    if (!enemy) continue;
    const ex = enemy.prevX + (enemy.x - enemy.prevX) * alpha;
    const ey = enemy.prevY + (enemy.y - enemy.prevY) * alpha;

    switch (enemy.type) {
      case 'straight_drone':
        renderer.drawRect(ex - 8, ey - 5, 16, 10, '#f85149');
        renderer.drawRect(ex - 3, ey - 2, 5, 4, '#ffdd44');
        break;
      case 'wave_drone':
        renderer.drawRect(ex - 7, ey - 7, 14, 14, '#39c5cf');
        renderer.drawRect(ex - 3, ey - 3, 5, 5, '#d2f4f4');
        break;
      case 'zigzag_drone':
        renderer.drawRect(ex - 8, ey - 5, 12, 10, '#d29922');
        renderer.drawRect(ex + 4, ey - 2, 5, 4, '#ffe08a');
        break;
      case 'shooter':
        renderer.drawRect(ex - 9, ey - 8, 18, 16, '#da3633');
        renderer.drawRect(ex - 12, ey - 2, 5, 4, '#ffa657');
        break;
      case 'kamikaze':
        renderer.drawRect(ex - 8, ey - 4, 16, 8, '#bc8cff');
        renderer.drawRect(ex - 2, ey - 8, 6, 16, '#8957e5');
        break;
      case 'squadron':
        renderer.drawRect(ex - 6, ey - 5, 12, 10, '#3fb950');
        renderer.drawRect(ex - 9, ey - 2, 4, 4, '#9be9a8');
        break;
      case 'turret':
        renderer.drawRect(ex - 9, ey - 9, 18, 18, '#8b949e');
        renderer.drawRect(ex - 3, ey - 3, 10, 6, '#ffa657');
        break;
      case 'mine':
        renderer.drawRect(ex - 8, ey - 8, 16, 16, '#f2cc60');
        renderer.drawRect(ex - 3, ey - 3, 6, 6, '#6e4b00');
        break;
    }
  }

  // 4. Draw capsules with a letter as well as a color.
  for (let i = 0; i < world.capsules.activeCount; i++) {
    const capsule = world.capsules.items[i];
    if (!capsule) continue;
    const cx = capsule.prevX + (capsule.x - capsule.prevX) * alpha;
    const cy = capsule.prevY + (capsule.y - capsule.prevY) * alpha;
    const visual = CAPSULE_VISUALS[capsule.capsuleType];
    renderer.drawRect(cx - 8, cy - 8, 16, 16, visual.color);
    renderer.drawRect(cx - 6, cy - 6, 12, 12, '#f0f6fc');
    renderer.drawText(visual.letter, cx - 3, cy + 3, 8, '#0d1117');
  }

  // 5. Draw the boss when it is active.
  if (world.boss) {
    const boss = world.boss;
    const bx = boss.prevX + (boss.x - boss.prevX) * alpha;
    const by = boss.prevY + (boss.y - boss.prevY) * alpha;
    renderer.drawRect(bx - 30, by - 22, 60, 44, theme.bossPrimary);
    renderer.drawRect(bx - 26, by - 17, 52, 34, theme.bossSecondary);
    renderer.drawRect(bx - 34, by - 5, 12, 10, theme.bossAccent);
    renderer.drawRect(bx + 12, by - 7, 8, 14, '#ffdd44');
    renderer.drawRect(bx - 20, by - 26, 10, 6, theme.bossAccent);
    renderer.drawRect(bx + 10, by + 20, 10, 6, theme.bossAccent);
  }

  // 6. Draw particles
  for (let i = 0; i < world.particles.activeCount; i++) {
    const p = world.particles.items[i];
    if (!p) continue;
    renderer.drawRect(p.x, p.y, p.size, p.size, p.color);
  }

  // 7. Draw enemy shots
  for (let i = 0; i < world.enemyShots.activeCount; i++) {
    const shot = world.enemyShots.items[i];
    if (!shot) continue;
    const sx = shot.prevX + (shot.x - shot.prevX) * alpha;
    const sy = shot.prevY + (shot.y - shot.prevY) * alpha;
    renderer.drawRect(sx - 3, sy - 3, 6, 6, '#ff7b72');
  }

  // 8. Draw player shots
  for (let i = 0; i < world.playerShots.activeCount; i++) {
    const shot = world.playerShots.items[i];
    if (!shot) continue;
    const sx = shot.prevX + (shot.x - shot.prevX) * alpha;
    const sy = shot.prevY + (shot.y - shot.prevY) * alpha;
    renderer.drawRect(sx - 4, sy - 2, 10, 4, '#7ee787');
    renderer.drawRect(sx - 2, sy - 1, 6, 2, '#ffffff');
  }

  // 9. Draw player ship
  const player = world.player;
  if (!player.isDead) {
    const px = player.prevX + (player.x - player.prevX) * alpha;
    const py = player.prevY + (player.y - player.prevY) * alpha;

    // Invincibility flicker
    const visible = player.invincibleTicks === 0 || Math.floor(world.tick / 4) % 2 === 0;

    if (visible) {
      // Main fuselage
      renderer.drawRect(px - 10, py - 5, 20, 10, '#58a6ff');
      // Nose cone
      renderer.drawRect(px + 10, py - 2, 4, 4, '#1f6feb');
      // Cockpit
      renderer.drawRect(px - 2, py - 3, 6, 6, '#79c0ff');
      // Wings
      renderer.drawRect(px - 6, py - 8, 8, 3, '#388bfd');
      renderer.drawRect(px - 6, py + 5, 8, 3, '#388bfd');
      // Engine thruster glow
      renderer.drawRect(px - 13, py - 3, 3, 6, '#ffa657');

      // Shield ring if active
      if (player.shield > 0) {
        renderer.drawRect(px - 14, py - 14, 28, 2, '#3fb950');
        renderer.drawRect(px - 14, py + 12, 28, 2, '#3fb950');
        renderer.drawRect(px - 14, py - 14, 2, 28, '#3fb950');
        renderer.drawRect(px + 12, py - 14, 2, 28, '#3fb950');
      }
    }
  }

  renderer.end();
}
