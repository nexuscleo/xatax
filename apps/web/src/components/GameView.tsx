import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { type World, createWorld, step, STEP, UiStore } from '@vanguarda/core';
import { balance } from '@vanguarda/content';
import { CanvasRenderer } from '../canvas/CanvasRenderer';
import { InputManager } from '../input/InputManager';

export const GameView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [uiStore] = useState(() => new UiStore('playing'));
  const snapshot = useSyncExternalStore(uiStore.subscribe, uiStore.getSnapshot);

  const worldRef = useRef<World>(createWorld(Date.now()));
  const inputManagerRef = useRef<InputManager | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  const [fps, setFps] = useState(60);

  const restartGame = (): void => {
    worldRef.current = createWorld(Date.now());
    uiStore.update(worldRef.current, 'playing');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new CanvasRenderer(canvas);
    rendererRef.current = renderer;
    const inputManager = new InputManager();
    inputManagerRef.current = inputManager;

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
      while (acc >= STEP) {
        const input = inputManager.getInput();
        step(world, input);
        acc -= STEP;
      }

      // 10 Hz UI store update
      uiStore.update(world);

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
    };
  }, [uiStore]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Top HUD */}
      <header
        style={{
          width: '960px',
          maxWidth: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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
          <span style={{ color: '#8b949e' }}>FPS: </span>
          <strong style={{ color: fps >= 55 ? '#3fb950' : '#d29922' }}>{fps}</strong>
        </div>
      </header>

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

        {snapshot.state === 'gameover' && (
          <div
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
            <h2 style={{ color: '#f85149', fontSize: '2rem' }}>FIM DE JOGO</h2>
            <p style={{ color: '#8b949e' }}>
              Pontuação Final: <strong style={{ color: '#fff' }}>{snapshot.score}</strong>
            </p>
            <button
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
              Jogar Novamente
            </button>
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
          <strong>Bomba:</strong> X
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

  renderer.begin(logicalW, logicalH);

  // 1. Draw starfield background (deterministic based on scrollX)
  const offset = Math.floor(world.scrollX * 0.4) % logicalW;
  for (let s = 0; s < 40; s++) {
    const starX = (s * 37 - offset + logicalW * 2) % logicalW;
    const starY = ((s * 29) % (logicalH - 40)) + 20;
    renderer.drawRect(starX, starY, 1, 1, s % 2 === 0 ? '#58a6ff' : '#8b949e');
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
        renderer.drawRect(screenX, screenY, tileSize, tileSize, '#21262d');
        // Border highlight
        renderer.drawRect(screenX, screenY, tileSize, 1, '#30363d');
      }
    }
  }

  // 3. Draw particles
  for (let i = 0; i < world.particles.activeCount; i++) {
    const p = world.particles.items[i];
    if (!p) continue;
    renderer.drawRect(p.x, p.y, p.size, p.size, p.color);
  }

  // 4. Draw enemies (Straight Drones)
  for (let i = 0; i < world.enemies.activeCount; i++) {
    const enemy = world.enemies.items[i];
    if (!enemy) continue;
    const ex = enemy.prevX + (enemy.x - enemy.prevX) * alpha;
    const ey = enemy.prevY + (enemy.y - enemy.prevY) * alpha;

    // Enemy body (red rectangle)
    renderer.drawRect(ex - 8, ey - 6, 16, 12, '#f85149');
    // Enemy cockpit/eye
    renderer.drawRect(ex - 6, ey - 2, 4, 4, '#ffdd44');
    // Wing accents
    renderer.drawRect(ex + 2, ey - 8, 4, 2, '#da3633');
    renderer.drawRect(ex + 2, ey + 6, 4, 2, '#da3633');
  }

  // 5. Draw enemy shots
  for (let i = 0; i < world.enemyShots.activeCount; i++) {
    const shot = world.enemyShots.items[i];
    if (!shot) continue;
    const sx = shot.prevX + (shot.x - shot.prevX) * alpha;
    const sy = shot.prevY + (shot.y - shot.prevY) * alpha;
    renderer.drawRect(sx - 3, sy - 3, 6, 6, '#ff7b72');
  }

  // 6. Draw player shots
  for (let i = 0; i < world.playerShots.activeCount; i++) {
    const shot = world.playerShots.items[i];
    if (!shot) continue;
    const sx = shot.prevX + (shot.x - shot.prevX) * alpha;
    const sy = shot.prevY + (shot.y - shot.prevY) * alpha;
    renderer.drawRect(sx - 4, sy - 2, 10, 4, '#7ee787');
    renderer.drawRect(sx - 2, sy - 1, 6, 2, '#ffffff');
  }

  // 7. Draw player ship
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
