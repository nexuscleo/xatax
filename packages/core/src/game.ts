import { balance } from '@vanguarda/content';
import { checkCircleCollision, checkCircleTileCollision } from './collision';
import type { Input } from './input';
import { BUTTON_FIRE } from './input';
import type { World } from './world';

export const CORE_VERSION = '0.1.0';
export const STEP = 1 / 60;
export { createWorld } from './world';

/**
 * Executes one deterministic simulation step of the world.
 * Mutates the world in-place without heap allocations.
 */
export function step(world: World, input: Input): void {
  if (world.state === 'gameover') {
    return;
  }

  // 1. Tick increment
  world.tick++;

  // 2. Clear audio events from previous step
  world.events.length = 0;

  const player = world.player;

  // 3. Player update
  player.prevX = player.x;
  player.prevY = player.y;

  if (player.invincibleTicks > 0) {
    player.invincibleTicks--;
  }
  if (player.fireCooldown > 0) {
    player.fireCooldown--;
  }

  // Movement calculation
  const playerSpeed = balance.player.speed * player.speedMultiplier * STEP;
  const moveXRatio = Math.max(-1, Math.min(1, input.moveX / 127));
  const moveYRatio = Math.max(-1, Math.min(1, input.moveY / 127));

  player.x += moveXRatio * playerSpeed;
  player.y += moveYRatio * playerSpeed;

  // Clamp within viewport
  const minX = player.radius;
  const maxX = balance.world.logicalWidth - player.radius;
  const minY = player.radius;
  const maxY = balance.world.logicalHeight - player.radius;

  if (player.x < minX) player.x = minX;
  if (player.x > maxX) player.x = maxX;
  if (player.y < minY) player.y = minY;
  if (player.y > maxY) player.y = maxY;

  // Firing action
  if ((input.buttons & BUTTON_FIRE) !== 0 && player.fireCooldown === 0 && !player.isDead) {
    const shot = world.playerShots.acquire();
    if (shot) {
      shot.x = player.x + 12;
      shot.y = player.y;
      shot.prevX = shot.x;
      shot.prevY = shot.y;
      shot.vx = balance.player.shotSpeed;
      shot.vy = 0;
      shot.radius = balance.player.shotHitboxRadius;
      shot.damage = balance.player.shotDamage;
      shot.isPlayer = true;

      player.fireCooldown = balance.player.fireCadenceTicks;
      world.events.push({ type: 'shot', x: shot.x, y: shot.y });
    }
  }

  // 4. Scroll & terrain
  world.scrollX += balance.world.defaultScrollSpeed * STEP;

  // Check player terrain collision
  const tileSize = balance.world.tileSize;
  const worldPlayerX = player.x + world.scrollX;
  const minTileCol = Math.max(0, Math.floor((worldPlayerX - player.radius) / tileSize));
  const maxTileCol = Math.min(
    world.terrainWidthTiles - 1,
    Math.floor((worldPlayerX + player.radius) / tileSize),
  );
  const minTileRow = Math.max(0, Math.floor((player.y - player.radius) / tileSize));
  const maxTileRow = Math.min(
    world.terrainHeightTiles - 1,
    Math.floor((player.y + player.radius) / tileSize),
  );

  let terrainHit = false;
  for (let r = minTileRow; r <= maxTileRow && !terrainHit; r++) {
    const row = world.terrain[r];
    if (!row) continue;
    for (let c = minTileCol; c <= maxTileCol; c++) {
      if (row[c] === 1) {
        const tileLeft = c * tileSize;
        const tileTop = r * tileSize;
        if (
          checkCircleTileCollision(
            worldPlayerX,
            player.y,
            player.radius,
            tileLeft,
            tileTop,
            tileSize,
          )
        ) {
          terrainHit = true;
          break;
        }
      }
    }
  }

  if (terrainHit && player.invincibleTicks === 0) {
    handlePlayerDamage(world);
  }

  // 5. Spawn enemies (Wave logic prototype: every 90 ticks)
  if (world.tick % 90 === 0 && world.enemies.activeCount < world.enemies.capacity) {
    const enemy = world.enemies.acquire();
    if (enemy) {
      enemy.id = world.tick;
      enemy.type = 'straight_drone';
      enemy.x = balance.world.logicalWidth + 20;
      // Deterministic Y using RNG
      const randomY = 30 + Math.floor(world.rng() * (balance.world.logicalHeight - 60));
      enemy.y = randomY;
      enemy.prevX = enemy.x;
      enemy.prevY = enemy.y;
      enemy.vx = -balance.enemy.straightDrone.speed;
      enemy.vy = 0;
      enemy.radius = balance.enemy.straightDrone.hitboxRadius;
      enemy.hp = balance.enemy.straightDrone.hp;
      enemy.fireCooldown = 45;
      enemy.scoreValue = balance.enemy.straightDrone.scoreValue;
    }
  }

  // 6. Update enemies
  for (let i = world.enemies.activeCount - 1; i >= 0; i--) {
    const enemy = world.enemies.items[i];
    if (!enemy) continue;

    enemy.prevX = enemy.x;
    enemy.prevY = enemy.y;
    enemy.x += enemy.vx * STEP;

    // Enemy firing
    if (enemy.fireCooldown > 0) {
      enemy.fireCooldown--;
    } else if (enemy.x < balance.world.logicalWidth - 30 && enemy.x > 50) {
      const eShot = world.enemyShots.acquire();
      if (eShot) {
        eShot.x = enemy.x - 8;
        eShot.y = enemy.y;
        eShot.prevX = eShot.x;
        eShot.prevY = eShot.y;
        eShot.vx = -balance.enemy.straightDrone.shotSpeed;
        eShot.vy = 0;
        eShot.radius = balance.enemy.straightDrone.shotHitboxRadius;
        eShot.damage = 1;
        eShot.isPlayer = false;
        enemy.fireCooldown = balance.enemy.straightDrone.fireIntervalTicks;
      }
    }

    // Out of bounds removal
    if (enemy.x < -30) {
      world.enemies.swapRemove(i);
    }
  }

  // 7. Update shots
  for (let i = world.playerShots.activeCount - 1; i >= 0; i--) {
    const shot = world.playerShots.items[i];
    if (!shot) continue;
    shot.prevX = shot.x;
    shot.prevY = shot.y;
    shot.x += shot.vx * STEP;
    if (shot.x > balance.world.logicalWidth + 20) {
      world.playerShots.swapRemove(i);
    }
  }

  for (let i = world.enemyShots.activeCount - 1; i >= 0; i--) {
    const shot = world.enemyShots.items[i];
    if (!shot) continue;
    shot.prevX = shot.x;
    shot.prevY = shot.y;
    shot.x += shot.vx * STEP;
    if (shot.x < -20) {
      world.enemyShots.swapRemove(i);
    }
  }

  // 8. Collisions: Player Shots vs Enemies
  for (let si = world.playerShots.activeCount - 1; si >= 0; si--) {
    const shot = world.playerShots.items[si];
    if (!shot) continue;

    for (let ei = world.enemies.activeCount - 1; ei >= 0; ei--) {
      const enemy = world.enemies.items[ei];
      if (!enemy) continue;

      if (checkCircleCollision(shot.x, shot.y, shot.radius, enemy.x, enemy.y, enemy.radius)) {
        enemy.hp -= shot.damage;
        world.playerShots.swapRemove(si);
        spawnExplosionParticles(world, shot.x, shot.y, 4, '#ffdd44');

        if (enemy.hp <= 0) {
          world.score += enemy.scoreValue * (1 + Math.floor(world.combo / 10));
          world.combo++;
          world.events.push({ type: 'explosion', x: enemy.x, y: enemy.y });
          spawnExplosionParticles(world, enemy.x, enemy.y, 10, '#ff6600');
          world.enemies.swapRemove(ei);
        }
        break;
      }
    }
  }

  // Collisions: Enemy Shots vs Player
  if (player.invincibleTicks === 0 && !player.isDead) {
    for (let i = world.enemyShots.activeCount - 1; i >= 0; i--) {
      const shot = world.enemyShots.items[i];
      if (!shot) continue;

      if (checkCircleCollision(shot.x, shot.y, shot.radius, player.x, player.y, player.radius)) {
        world.enemyShots.swapRemove(i);
        handlePlayerDamage(world);
        break;
      }
    }
  }

  // Collisions: Enemies vs Player
  if (player.invincibleTicks === 0 && !player.isDead) {
    for (let i = world.enemies.activeCount - 1; i >= 0; i--) {
      const enemy = world.enemies.items[i];
      if (!enemy) continue;

      if (checkCircleCollision(player.x, player.y, player.radius, enemy.x, enemy.y, enemy.radius)) {
        world.enemies.swapRemove(i);
        spawnExplosionParticles(world, enemy.x, enemy.y, 8, '#ff6600');
        handlePlayerDamage(world);
        break;
      }
    }
  }

  // 9. Update particles
  for (let i = world.particles.activeCount - 1; i >= 0; i--) {
    const p = world.particles.items[i];
    if (!p) continue;
    p.x += p.vx * STEP;
    p.y += p.vy * STEP;
    p.life++;
    if (p.life >= p.maxLife) {
      world.particles.swapRemove(i);
    }
  }
}

function handlePlayerDamage(world: World): void {
  const player = world.player;
  world.combo = 0;
  world.events.push({ type: 'playerHit', x: player.x, y: player.y });
  spawnExplosionParticles(world, player.x, player.y, 12, '#ff3333');

  if (player.shield > 0) {
    player.shield = 0;
    player.invincibleTicks = 60; // 1s grace period
    return;
  }

  player.lives--;
  player.weaponLevel = Math.max(1, player.weaponLevel - 1);
  player.invincibleTicks = balance.player.invincibilityTicks;

  if (player.lives <= 0) {
    player.isDead = true;
    world.state = 'gameover';
  }
}

function spawnExplosionParticles(
  world: World,
  x: number,
  y: number,
  count: number,
  color: string,
): void {
  for (let i = 0; i < count; i++) {
    const p = world.particles.acquire();
    if (!p) return;
    p.x = x;
    p.y = y;
    // Deterministic spread calculation
    const angle = world.rng() * 6.283185307179586;
    const speed = 40 + world.rng() * 80;
    // Safe deterministic cos/sin approximation or table
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.life = 0;
    p.maxLife = 10 + Math.floor(world.rng() * 10);
    p.color = color;
    p.size = 2;
  }
}
