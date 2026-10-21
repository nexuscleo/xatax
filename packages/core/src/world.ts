import type { Difficulty, EnemyType } from '@vanguarda/content';
import { balance } from '@vanguarda/content';
import { EntityPool } from './pools';
import { createRng } from './random';

export interface PlayerEntity {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  radius: number;
  lives: number;
  weaponLevel: number;
  shield: number;
  bombs: number;
  speedMultiplier: number;
  invincibleTicks: number;
  fireCooldown: number;
  isDead: boolean;
}

export interface ShotEntity {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  isPlayer: boolean;
}

export interface EnemyEntity {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  fireCooldown: number;
  scoreValue: number;
}

export interface ParticleEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export type GameEventType = 'shot' | 'explosion' | 'playerHit' | 'powerup' | 'bossHit' | 'bomb';

export interface GameEvent {
  type: GameEventType;
  x?: number;
  y?: number;
}

export interface World {
  tick: number;
  seed: number;
  rng: () => number;
  difficulty: Difficulty;
  levelId: string;
  state: 'playing' | 'worldClear' | 'gameover';
  score: number;
  combo: number;
  scrollX: number;
  player: PlayerEntity;
  playerShots: EntityPool<ShotEntity>;
  enemyShots: EntityPool<ShotEntity>;
  enemies: EntityPool<EnemyEntity>;
  particles: EntityPool<ParticleEntity>;
  events: GameEvent[];
  /**
   * Terrain map represented as an array of rows, where 1 is solid tile, 0 is empty.
   */
  terrain: number[][];
  terrainWidthTiles: number;
  terrainHeightTiles: number;
}

/**
 * Creates the initial game world state.
 */
export function createWorld(
  seed: number,
  levelId = 'prototype-world-1',
  difficulty: Difficulty = 'normal',
): World {
  const rng = createRng(seed);
  const initialLives = balance.player.initialLives[difficulty];

  // Initialize terrain rows: 270 / 16 = ~17 rows
  const rows = Math.ceil(balance.world.logicalHeight / balance.world.tileSize);
  const cols = 200; // 200 tiles width for prototype corridor
  const terrain: number[][] = [];

  for (let r = 0; r < rows; r++) {
    const row = new Array<number>(cols).fill(0);
    // Add border ceiling and floor blocks with some obstacles
    for (let c = 0; c < cols; c++) {
      if (r === 0 || r === rows - 1) {
        row[c] = 1; // ceiling and floor
      } else if ((c === 30 || c === 70 || c === 120) && (r < 4 || r > rows - 5)) {
        row[c] = 1; // narrow passage blocks
      }
    }
    terrain.push(row);
  }

  const player: PlayerEntity = {
    x: 60,
    y: balance.world.logicalHeight / 2,
    prevX: 60,
    prevY: balance.world.logicalHeight / 2,
    vx: 0,
    vy: 0,
    radius: balance.player.hitboxRadius,
    lives: initialLives,
    weaponLevel: 1,
    shield: 0,
    bombs: 1,
    speedMultiplier: 1.0,
    invincibleTicks: balance.player.invincibilityTicks,
    fireCooldown: 0,
    isDead: false,
  };

  const playerShots = new EntityPool<ShotEntity>(balance.pools.maxPlayerShots, () => ({
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    vx: 0,
    vy: 0,
    radius: balance.player.shotHitboxRadius,
    damage: balance.player.shotDamage,
    isPlayer: true,
  }));

  const enemyShots = new EntityPool<ShotEntity>(balance.pools.maxEnemyShots, () => ({
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    vx: 0,
    vy: 0,
    radius: balance.enemy.straightDrone.shotHitboxRadius,
    damage: 1,
    isPlayer: false,
  }));

  const enemies = new EntityPool<EnemyEntity>(balance.pools.maxEnemies, () => ({
    id: 0,
    type: 'straight_drone',
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    vx: 0,
    vy: 0,
    radius: balance.enemy.straightDrone.hitboxRadius,
    hp: balance.enemy.straightDrone.hp,
    fireCooldown: 0,
    scoreValue: balance.enemy.straightDrone.scoreValue,
  }));

  const particles = new EntityPool<ParticleEntity>(balance.pools.maxParticles, () => ({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 15,
    color: '#ffaa00',
    size: 2,
  }));

  return {
    tick: 0,
    seed,
    rng,
    difficulty,
    levelId,
    state: 'playing',
    score: 0,
    combo: 0,
    scrollX: 0,
    player,
    playerShots,
    enemyShots,
    enemies,
    particles,
    events: [],
    terrain,
    terrainWidthTiles: cols,
    terrainHeightTiles: rows,
  };
}
