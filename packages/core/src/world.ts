import type { CapsuleType, Difficulty, EnemyType, LevelData, PathId } from '@vanguarda/content';
import { balance, levels } from '@vanguarda/content';
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
  hasMissile: boolean;
  shield: number;
  bombs: number;
  speedStackCount: number;
  speedMultiplier: number;
  invincibleTicks: number;
  fireCooldown: number;
  isDead: boolean;
  hasTakenDamage: boolean;
  /** Acumula ticks sem levar dano (para bônus de mundo sem dano) */
  ticksWithoutDamage: number;
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
  /** Y de spawn, usado para cálculo de trajetória relativa */
  spawnY: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  fireCooldown: number;
  scoreValue: number;
  /** Índice no array de trajetória pré-calculada */
  pathTick: number;
  pathId: PathId;
  /** Ângulo atual de movimento (para kamikaze) em radianos * 1000 (inteiro) */
  angleMilliRad: number;
  /** X onde o inimigo para de se mover (shooter) */
  entryX: number;
  /** Indica que o inimigo chegou à posição de combate */
  entryComplete: boolean;
  /** Tipo de cápsula que dropa ao morrer; -1 = nenhuma */
  dropCapsule: CapsuleType | null;
}

export interface CapsuleEntity {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  radius: number;
  capsuleType: CapsuleType;
}

export interface BossEntity {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  radius: number;
  hp: number;
  maxHp: number;
  phase: 1 | 2 | 3;
  attackTick: number;
  scoreValue: number;
  isDead: boolean;
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

export type GameEventType =
  'shot' | 'explosion' | 'playerHit' | 'powerup' | 'bossHit' | 'bomb' | 'extraLife' | 'worldClear';

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
  levelData: LevelData;
  previousButtons: number;
  state: 'playing' | 'worldClear' | 'gameover';
  score: number;
  combo: number;
  capsulesCollected: number;
  nextExtraLifeScore: number;
  /** Índice da próxima onda a verificar para spawn */
  waveIndex: number;
  scrollX: number;
  player: PlayerEntity;
  playerShots: EntityPool<ShotEntity>;
  enemyShots: EntityPool<ShotEntity>;
  enemies: EntityPool<EnemyEntity>;
  capsules: EntityPool<CapsuleEntity>;
  particles: EntityPool<ParticleEntity>;
  boss: BossEntity | null;
  events: GameEvent[];
  /**
   * Mapa de terreno: array de linhas, onde 1 = bloco sólido, 0 = vazio.
   */
  terrain: number[][];
  terrainWidthTiles: number;
  terrainHeightTiles: number;
}

/**
 * Cria o estado inicial do mundo do jogo.
 */
export function createWorld(
  seed: number,
  levelId = 'world-1',
  difficulty: Difficulty = 'normal',
): World {
  const levelData = levels[levelId];
  if (!levelData) {
    throw new Error(`Unknown level id "${levelId}"`);
  }

  const rng = createRng(seed);
  const initialLives = balance.player.initialLives[difficulty];

  const rows = levelData.terrain.length;
  let cols = 0;
  for (let r = 0; r < rows; r++) {
    const sourceRow = levelData.terrain[r]!;
    if (sourceRow.length > cols) cols = sourceRow.length;
  }

  const terrain: number[][] = [];
  for (let r = 0; r < rows; r++) {
    const sourceRow = levelData.terrain[r]!;
    const row = new Array<number>(cols).fill(0);
    for (let c = 0; c < sourceRow.length; c++) {
      row[c] = sourceRow[c] === '#' ? 1 : 0;
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
    hasMissile: false,
    shield: 0,
    bombs: balance.player.bombCount,
    speedStackCount: 0,
    speedMultiplier: 1.0,
    invincibleTicks: balance.player.invincibilityTicks,
    fireCooldown: 0,
    isDead: false,
    hasTakenDamage: false,
    ticksWithoutDamage: 0,
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
    spawnY: 0,
    prevX: 0,
    prevY: 0,
    vx: 0,
    vy: 0,
    radius: balance.enemy.straightDrone.hitboxRadius,
    hp: balance.enemy.straightDrone.hp,
    fireCooldown: 0,
    scoreValue: balance.enemy.straightDrone.scoreValue,
    pathTick: 0,
    pathId: 'sine_wave',
    angleMilliRad: 0,
    entryX: 0,
    entryComplete: false,
    dropCapsule: null,
  }));

  const capsules = new EntityPool<CapsuleEntity>(balance.pools.maxCapsules, () => ({
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    radius: balance.capsule.hitboxRadius,
    capsuleType: 'weapon',
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
    levelId: levelData.id,
    levelData,
    previousButtons: 0,
    state: 'playing',
    score: 0,
    combo: 0,
    capsulesCollected: 0,
    nextExtraLifeScore: balance.player.extraLifeScoreInterval,
    waveIndex: 0,
    scrollX: 0,
    player,
    playerShots,
    enemyShots,
    enemies,
    capsules,
    particles,
    boss: null,
    events: [],
    terrain,
    terrainWidthTiles: cols,
    terrainHeightTiles: rows,
  };
}
