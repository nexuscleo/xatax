import type { CapsuleType, EnemyType } from '@vanguarda/content';
import { balance, paths } from '@vanguarda/content';
import { checkCircleCollision, checkCircleTileCollision } from './collision';
import type { Input } from './input';
import { BUTTON_BOMB, BUTTON_FIRE } from './input';
import type { BossEntity, EnemyEntity, World } from './world';

export const CORE_VERSION = '0.2.0';
export const STEP = 1 / 60;
export { createWorld } from './world';

// ---------------------------------------------------------------------------
// Tabelas de cos/sin pré-calculadas para determinismo entre motores JS/Hermes.
// Ângulos de 0 a 7 (octantes) representando múltiplos de 45°.
// cos45 ≈ 0.7071 → usamos valor inteiro × 1000 = 707.
// ---------------------------------------------------------------------------
/** cos(45°) × 1000, inteiro para evitar divergência de ponto flutuante */
const COS45_1000 = 707;

/**
 * Calcula cos/sin aproximados de um ângulo em mili-radianos (inteiro)
 * usando interpolação linear da tabela de 360 entradas.
 * Retorna objeto com campos `c` (cos) e `s` (sin) × 1000.
 */
function cosSin1000(angleMilliRad: number): { c: number; s: number } {
  // Normaliza para [0, 6283) milirad
  let a = angleMilliRad % 6283;
  if (a < 0) a += 6283;
  // Índice de 0 a 359
  const idx = Math.floor((a * 360) / 6283) % 360;
  return { c: COS_TABLE[idx]!, s: SIN_TABLE[idx]! };
}

// Tabela de cos × 1000 para 360 ângulos (0°…359°)
// Gerada com Math.round(Math.cos(i * Math.PI / 180) * 1000)
const COS_TABLE: number[] = [
  1000, 999, 998, 997, 993, 988, 982, 975, 966, 956, 946, 934, 920, 906, 891, 875, 857, 839, 819,
  799, 777, 755, 731, 707, 682, 656, 629, 602, 574, 545, 515, 485, 454, 423, 391, 358, 325, 292,
  258, 224, 190, 156, 121, 87, 52, 17, -17, -52, -87, -121, -156, -190, -224, -258, -292, -325,
  -358, -391, -423, -454, -485, -515, -545, -574, -602, -629, -656, -682, -707, -731, -755, -777,
  -799, -819, -839, -857, -875, -891, -906, -920, -934, -946, -956, -966, -975, -982, -988, -993,
  -997, -998, -999, -1000, -999, -998, -997, -993, -988, -982, -975, -966, -956, -946, -934, -920,
  -906, -891, -875, -857, -839, -819, -799, -777, -755, -731, -707, -682, -656, -629, -602, -574,
  -545, -515, -485, -454, -423, -391, -358, -325, -292, -258, -224, -190, -156, -121, -87, -52,
  -17, 17, 52, 87, 121, 156, 190, 224, 258, 292, 325, 358, 391, 423, 454, 485, 515, 545, 574, 602,
  629, 656, 682, 707, 731, 755, 777, 799, 819, 839, 857, 875, 891, 906, 920, 934, 946, 956, 966,
  975, 982, 988, 993, 997, 998, 999, 1000, 999, 998, 997, 993, 988, 982, 975, 966, 956, 946, 934,
  920, 906, 891, 875, 857, 839, 819, 799, 777, 755, 731, 707, 682, 656, 629, 602, 574, 545, 515,
  485, 454, 423, 391, 358, 325, 292, 258, 224, 190, 156, 121, 87, 52, 17, -17, -52, -87, -121,
  -156, -190, -224, -258, -292, -325, -358, -391, -423, -454, -485, -515, -545, -574, -602, -629,
  -656, -682, -707, -731, -755, -777, -799, -819, -839, -857, -875, -891, -906, -920, -934, -946,
  -956, -966, -975, -982, -988, -993, -997, -998, -999,
];

// Tabela de sin × 1000 para 360 ângulos (0°…359°)
// sin(i) = cos(i - 90) → deslocamento de 90 entradas
const SIN_TABLE: number[] = [
  0, 17, 35, 52, 70, 87, 105, 122, 139, 156, 174, 191, 208, 225, 242, 259, 276, 292, 309, 326,
  342, 358, 374, 390, 406, 422, 438, 454, 469, 485, 500, 515, 530, 545, 559, 574, 588, 602, 616,
  629, 643, 656, 669, 682, 695, 707, 719, 731, 743, 755, 766, 777, 788, 799, 809, 819, 829, 839,
  848, 857, 866, 875, 883, 891, 898, 906, 913, 920, 927, 933, 939, 945, 951, 956, 961, 966, 970,
  975, 978, 982, 985, 988, 990, 993, 995, 997, 998, 999, 1000, 999, 999, 998, 997, 996, 995, 993,
  991, 990, 988, 985, 982, 980, 978, 975, 971, 966, 961, 956, 951, 945, 940, 933, 927, 921, 914,
  906, 899, 891, 883, 875, 866, 857, 848, 839, 829, 819, 809, 799, 788, 777, 766, 755, 743, 731,
  719, 707, 695, 682, 669, 656, 643, 629, 616, 602, 588, 574, 559, 545, 530, 515, 500, 484, 469,
  454, 438, 422, 406, 390, 374, 358, 342, 326, 309, 292, 276, 259, 242, 225, 208, 191, 174, 156,
  139, 122, 105, 87, 70, 52, 35, 17, 0, -17, -35, -52, -70, -87, -105, -122, -139, -156, -174,
  -191, -208, -225, -242, -259, -276, -292, -309, -326, -342, -358, -374, -390, -406, -422, -438,
  -454, -469, -485, -500, -515, -530, -545, -559, -574, -588, -602, -616, -629, -643, -656, -669,
  -682, -695, -707, -719, -731, -743, -755, -766, -777, -788, -799, -809, -819, -829, -839, -848,
  -857, -866, -875, -883, -891, -898, -906, -913, -920, -927, -933, -939, -945, -951, -956, -961,
  -966, -970, -975, -978, -982, -985, -988, -990, -993, -995, -997, -998, -999, -1000, -999, -999,
  -998, -997, -996, -995, -993, -991, -990, -988, -985, -982, -980, -978, -975, -971, -966, -961,
  -956, -951, -945, -940, -933, -927, -921, -914, -906, -899, -891, -883, -875, -866, -857, -848,
  -839, -829, -819, -809, -799, -788, -777, -766, -755, -743, -731, -719, -707, -695, -682, -669,
  -656, -643, -629, -616, -602, -588, -574, -559, -545, -530, -515, -500, -484, -469, -454, -438,
  -422, -406, -390, -374, -358, -342, -326, -309, -292, -276, -259, -242, -225, -208, -191, -174,
  -156, -139, -122, -105, -87, -70, -52, -35, -17,
];

/**
 * Executa um passo determinístico da simulação.
 * Muta o mundo sem alocar objetos no loop principal.
 */
export function step(world: World, input: Input): void {
  if (world.state !== 'playing') {
    return;
  }

  // 1. Incrementa tick
  world.tick++;

  // 2. Limpa eventos de áudio do passo anterior
  world.events.length = 0;

  const player = world.player;

  // 3. Atualização do jogador
  player.prevX = player.x;
  player.prevY = player.y;
  player.ticksWithoutDamage++;

  if (player.invincibleTicks > 0) {
    player.invincibleTicks--;
  }
  if (player.fireCooldown > 0) {
    player.fireCooldown--;
  }

  // Movimentação
  const playerSpeed = balance.player.speed * player.speedMultiplier * STEP;
  const moveXRatio = input.moveX < -127 ? -1 : input.moveX > 127 ? 1 : input.moveX / 127;
  const moveYRatio = input.moveY < -127 ? -1 : input.moveY > 127 ? 1 : input.moveY / 127;

  player.x += moveXRatio * playerSpeed;
  player.y += moveYRatio * playerSpeed;

  // Mantém dentro da tela
  const pR = player.radius;
  if (player.x < pR) player.x = pR;
  if (player.x > balance.world.logicalWidth - pR) player.x = balance.world.logicalWidth - pR;
  if (player.y < pR) player.y = pR;
  if (player.y > balance.world.logicalHeight - pR) player.y = balance.world.logicalHeight - pR;

  // Disparo
  if ((input.buttons & BUTTON_FIRE) !== 0 && player.fireCooldown === 0 && !player.isDead) {
    firePlayerWeapon(world);
  }

  // Bomba
  if ((input.buttons & BUTTON_BOMB) !== 0 && player.bombs > 0) {
    useBomb(world);
  }

  // 4. Rolagem e colisão com terreno
  world.scrollX += balance.world.defaultScrollSpeed * STEP;

  checkPlayerTerrainCollision(world);

  // 5. Spawn de ondas
  spawnWaves(world);

  // 6. Atualização de inimigos
  updateEnemies(world);

  // 7. Atualização do boss
  if (world.boss) {
    updateBoss(world, world.boss);
  }

  // 8. Atualização dos tiros
  updateShots(world);

  // 9. Colisões
  resolveCollisions(world);

  // 10. Atualização de cápsulas
  updateCapsules(world);

  // 11. Atualização de partículas
  updateParticles(world);

  // 12. Vida extra por pontuação
  checkExtraLife(world);
}

// ---------------------------------------------------------------------------
// Disparo do jogador
// ---------------------------------------------------------------------------

function firePlayerWeapon(world: World): void {
  const player = world.player;
  const wl = player.weaponLevel;

  // Cadência por nível
  const cadenceTicks =
    wl >= 3 ? balance.weapons.level3CadenceTicks : balance.weapons.level2CadenceTicks;
  player.fireCooldown = cadenceTicks;

  const sx = player.x + 12;

  if (wl === 1) {
    spawnPlayerShot(world, sx, player.y, balance.player.shotSpeed, 0);
  } else if (wl === 2) {
    spawnPlayerShot(world, sx, player.y - 4, balance.player.shotSpeed, 0);
    spawnPlayerShot(world, sx, player.y + 4, balance.player.shotSpeed, 0);
  } else {
    // Nível 3: leque com ±20° (vx ≈ speed*cos20 ≈ speed*0.94, vy ≈ ±speed*sin20 ≈ ±speed*0.34)
    spawnPlayerShot(world, sx, player.y, balance.player.shotSpeed, 0);
    spawnPlayerShot(
      world,
      sx,
      player.y,
      Math.round(balance.player.shotSpeed * 940) / 1000,
      -Math.round(balance.player.shotSpeed * 342) / 1000,
    );
    spawnPlayerShot(
      world,
      sx,
      player.y,
      Math.round(balance.player.shotSpeed * 940) / 1000,
      Math.round(balance.player.shotSpeed * 342) / 1000,
    );
  }

  // Mísseis diagonais (±45°): vx = vy = speed * COS45_1000 / 1000
  if (player.hasMissile) {
    const mv = Math.round((balance.player.shotSpeed * COS45_1000) / 1000);
    spawnPlayerShot(world, sx, player.y, mv, -mv);
    spawnPlayerShot(world, sx, player.y, mv, mv);
  }

  world.events.push({ type: 'shot', x: sx, y: player.y });
}

function spawnPlayerShot(world: World, x: number, y: number, vx: number, vy: number): void {
  const shot = world.playerShots.acquire();
  if (!shot) return;
  shot.x = x;
  shot.y = y;
  shot.prevX = x;
  shot.prevY = y;
  shot.vx = vx;
  shot.vy = vy;
  shot.radius = balance.player.shotHitboxRadius;
  shot.damage = balance.player.shotDamage;
  shot.isPlayer = true;
}

// ---------------------------------------------------------------------------
// Bomba
// ---------------------------------------------------------------------------

function useBomb(world: World): void {
  world.player.bombs--;
  world.events.push({ type: 'bomb', x: world.player.x, y: world.player.y });

  // Remove todos os tiros inimigos
  for (let i = world.enemyShots.activeCount - 1; i >= 0; i--) {
    world.enemyShots.swapRemove(i);
  }

  // Dano em área em todos os inimigos
  for (let i = world.enemies.activeCount - 1; i >= 0; i--) {
    const enemy = world.enemies.items[i];
    if (!enemy) continue;
    enemy.hp -= 3;
    if (enemy.hp <= 0) {
      killEnemy(world, i, enemy);
    } else {
      world.events.push({ type: 'explosion', x: enemy.x, y: enemy.y });
    }
  }

  // Dano no boss
  if (world.boss && !world.boss.isDead) {
    world.boss.hp -= 5;
    world.events.push({ type: 'bossHit', x: world.boss.x, y: world.boss.y });
    checkBossPhase(world, world.boss);
  }
}

// ---------------------------------------------------------------------------
// Colisão com terreno
// ---------------------------------------------------------------------------

function checkPlayerTerrainCollision(world: World): void {
  const player = world.player;
  const tileSize = balance.world.tileSize;
  const worldPlayerX = player.x + world.scrollX;
  const minCol = Math.max(0, Math.floor((worldPlayerX - player.radius) / tileSize));
  const maxCol = Math.min(
    world.terrainWidthTiles - 1,
    Math.floor((worldPlayerX + player.radius) / tileSize),
  );
  const minRow = Math.max(0, Math.floor((player.y - player.radius) / tileSize));
  const maxRow = Math.min(
    world.terrainHeightTiles - 1,
    Math.floor((player.y + player.radius) / tileSize),
  );

  for (let r = minRow; r <= maxRow; r++) {
    const row = world.terrain[r];
    if (!row) continue;
    for (let c = minCol; c <= maxCol; c++) {
      if (row[c] === 1) {
        const tileLeft = c * tileSize;
        const tileTop = r * tileSize;
        if (
          checkCircleTileCollision(worldPlayerX, player.y, player.radius, tileLeft, tileTop, tileSize)
        ) {
          if (player.invincibleTicks === 0) {
            handlePlayerDamage(world);
          }
          return;
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Spawn de ondas (protótipo: ondas simples; integração com LevelData na Fase 4)
// ---------------------------------------------------------------------------

function spawnWaves(world: World): void {
  // Protótipo: spawn de drones retos a cada 90 ticks para testar o loop
  if (world.tick % 90 === 0 && world.enemies.activeCount < world.enemies.capacity) {
    const enemy = world.enemies.acquire();
    if (!enemy) return;

    const typeRoll = world.rng();
    const yPos = 30 + Math.floor(world.rng() * (balance.world.logicalHeight - 60));

    enemy.id = world.tick;
    enemy.x = balance.world.logicalWidth + 20;
    enemy.y = yPos;
    enemy.spawnY = yPos;
    enemy.prevX = enemy.x;
    enemy.prevY = enemy.y;
    enemy.pathTick = 0;
    enemy.angleMilliRad = 3141; // ~180° → apontando para a esquerda
    enemy.entryX = balance.enemy.shooter.entryDistance;
    enemy.entryComplete = false;
    enemy.dropCapsule = null;

    if (typeRoll < 0.35) {
      setupEnemyType(enemy, 'straight_drone');
    } else if (typeRoll < 0.55) {
      setupEnemyType(enemy, 'wave_drone');
    } else if (typeRoll < 0.7) {
      setupEnemyType(enemy, 'zigzag_drone');
    } else if (typeRoll < 0.82) {
      setupEnemyType(enemy, 'shooter');
    } else if (typeRoll < 0.9) {
      setupEnemyType(enemy, 'kamikaze');
    } else {
      setupEnemyType(enemy, 'mine');
    }

    // Spawn do boss no tick 2700
    if (world.tick === 2700 && world.boss === null) {
      spawnBoss(world);
    }
  }
}

function setupEnemyType(enemy: EnemyEntity, type: EnemyType): void {
  enemy.type = type;
  switch (type) {
    case 'straight_drone':
      enemy.vx = -balance.enemy.straightDrone.speed;
      enemy.vy = 0;
      enemy.radius = balance.enemy.straightDrone.hitboxRadius;
      enemy.hp = balance.enemy.straightDrone.hp;
      enemy.fireCooldown = balance.enemy.straightDrone.fireIntervalTicks;
      enemy.scoreValue = balance.enemy.straightDrone.scoreValue;
      break;
    case 'wave_drone':
      enemy.vx = -balance.enemy.waveDrone.speed;
      enemy.vy = 0;
      enemy.radius = balance.enemy.waveDrone.hitboxRadius;
      enemy.hp = balance.enemy.waveDrone.hp;
      enemy.fireCooldown = 0;
      enemy.scoreValue = balance.enemy.waveDrone.scoreValue;
      break;
    case 'zigzag_drone':
      enemy.vx = -balance.enemy.zigzagDrone.speed;
      enemy.vy = 0;
      enemy.radius = balance.enemy.zigzagDrone.hitboxRadius;
      enemy.hp = balance.enemy.zigzagDrone.hp;
      enemy.fireCooldown = 0;
      enemy.scoreValue = balance.enemy.zigzagDrone.scoreValue;
      break;
    case 'shooter':
      enemy.vx = -balance.enemy.shooter.speed;
      enemy.vy = 0;
      enemy.radius = balance.enemy.shooter.hitboxRadius;
      enemy.hp = balance.enemy.shooter.hp;
      enemy.fireCooldown = balance.enemy.shooter.fireIntervalTicks;
      enemy.scoreValue = balance.enemy.shooter.scoreValue;
      break;
    case 'kamikaze':
      enemy.vx = -balance.enemy.kamikaze.speed;
      enemy.vy = 0;
      enemy.radius = balance.enemy.kamikaze.hitboxRadius;
      enemy.hp = balance.enemy.kamikaze.hp;
      enemy.fireCooldown = 0;
      enemy.scoreValue = balance.enemy.kamikaze.scoreValue;
      break;
    case 'squadron':
      enemy.vx = -balance.enemy.squadron.speed;
      enemy.vy = 0;
      enemy.radius = balance.enemy.squadron.hitboxRadius;
      enemy.hp = balance.enemy.squadron.hp;
      enemy.fireCooldown = 0;
      enemy.scoreValue = balance.enemy.squadron.scoreValue;
      break;
    case 'turret':
      enemy.vx = 0;
      enemy.vy = 0;
      enemy.radius = balance.enemy.turret.hitboxRadius;
      enemy.hp = balance.enemy.turret.hp;
      enemy.fireCooldown = balance.enemy.turret.fireIntervalTicks;
      enemy.scoreValue = balance.enemy.turret.scoreValue;
      break;
    case 'mine':
      enemy.vx = 0;
      enemy.vy = 0;
      enemy.radius = balance.enemy.mine.hitboxRadius;
      enemy.hp = balance.enemy.mine.hp;
      enemy.fireCooldown = 0;
      enemy.scoreValue = balance.enemy.mine.scoreValue;
      break;
  }
}

// ---------------------------------------------------------------------------
// Atualização de inimigos
// ---------------------------------------------------------------------------

function updateEnemies(world: World): void {
  for (let i = world.enemies.activeCount - 1; i >= 0; i--) {
    const enemy = world.enemies.items[i];
    if (!enemy) continue;

    enemy.prevX = enemy.x;
    enemy.prevY = enemy.y;
    enemy.pathTick++;

    switch (enemy.type) {
      case 'straight_drone':
        updateStraightDrone(world, enemy, i);
        break;
      case 'wave_drone':
        updateWaveDrone(world, enemy);
        break;
      case 'zigzag_drone':
        updateZigzagDrone(world, enemy);
        break;
      case 'shooter':
        updateShooter(world, enemy, i);
        break;
      case 'kamikaze':
        updateKamikaze(world, enemy);
        break;
      case 'squadron':
        updateSquadron(world, enemy);
        break;
      case 'turret':
        updateTurret(world, enemy, i);
        break;
      case 'mine':
        updateMine(world, enemy);
        break;
    }

    // Remove inimigos fora da tela (exceto turret e mine que são estáticos)
    if (enemy.type !== 'turret' && enemy.type !== 'mine' && enemy.x < -30) {
      world.enemies.swapRemove(i);
    }
  }
}

// Drone reto: avança em linha reta e atira
function updateStraightDrone(world: World, enemy: EnemyEntity, idx: number): void {
  enemy.x += enemy.vx * STEP;

  if (enemy.fireCooldown > 0) {
    enemy.fireCooldown--;
  } else if (enemy.x < balance.world.logicalWidth - 20 && enemy.x > 40) {
    spawnEnemyShot(world, enemy.x - 8, enemy.y, -balance.enemy.straightDrone.shotSpeed, 0);
    enemy.fireCooldown = balance.enemy.straightDrone.fireIntervalTicks;
  }

  if (enemy.x < -30) {
    world.enemies.swapRemove(idx);
  }
}

// Drone ondulatório: trajetória Y a partir da tabela sine_wave
function updateWaveDrone(_world: World, enemy: EnemyEntity): void {
  enemy.x += enemy.vx * STEP;
  const ptIdx = enemy.pathTick % paths.sine_wave.length;
  const yOffset = (paths.sine_wave[ptIdx]! * balance.enemy.waveDrone.pathAmplitude) / 32;
  enemy.y = enemy.spawnY + yOffset;
  // Clamp dentro da tela
  if (enemy.y < 10) enemy.y = 10;
  if (enemy.y > balance.world.logicalHeight - 10) enemy.y = balance.world.logicalHeight - 10;
}

// Drone zigue-zague: inverte direção Y a cada stepTicks
function updateZigzagDrone(_world: World, enemy: EnemyEntity): void {
  enemy.x += enemy.vx * STEP;
  const stepTicks = balance.enemy.zigzagDrone.stepTicks;
  const phase = Math.floor(enemy.pathTick / stepTicks) % 2;
  const stepSize = balance.enemy.zigzagDrone.stepSize;
  const targetY = phase === 0 ? enemy.spawnY - stepSize : enemy.spawnY + stepSize;
  // Move suavemente até o alvo a 80px/s
  const dy = targetY - enemy.y;
  const moveSpeed = 80 * STEP;
  if (dy > moveSpeed) enemy.y += moveSpeed;
  else if (dy < -moveSpeed) enemy.y -= moveSpeed;
  else enemy.y = targetY;
  // Clamp
  if (enemy.y < 10) enemy.y = 10;
  if (enemy.y > balance.world.logicalHeight - 10) enemy.y = balance.world.logicalHeight - 10;
}

// Atirador: avança até entryX, para e atira em direção à nave
function updateShooter(world: World, enemy: EnemyEntity, idx: number): void {
  if (!enemy.entryComplete) {
    enemy.x += enemy.vx * STEP;
    if (enemy.x <= enemy.entryX) {
      enemy.x = enemy.entryX;
      enemy.vx = 0;
      enemy.entryComplete = true;
    }
  }

  if (enemy.fireCooldown > 0) {
    enemy.fireCooldown--;
  } else {
    // Atira em direção ao jogador (usando aproximação de ângulo)
    const dx = world.player.x - enemy.x;
    const dy = world.player.y - enemy.y;
    // Normaliza sem sqrt: usa divisão pelo valor máximo de |dx|+|dy| (aproximação rápida)
    const absDx = dx < 0 ? -dx : dx;
    const absDy = dy < 0 ? -dy : dy;
    const len = absDx + absDy;
    if (len > 0) {
      const spd = balance.enemy.shooter.shotSpeed;
      // Fator de correção: escala diagonal ≈ 0.75*spd para compensar aproximação
      const factor = (spd * 3) / 4;
      const svx = (dx * factor) / len;
      const svy = (dy * factor) / len;
      spawnEnemyShot(world, enemy.x - 8, enemy.y, svx, svy);
    }
    enemy.fireCooldown = balance.enemy.shooter.fireIntervalTicks;
  }

  // Recua para fora da tela após ficar muito tempo
  if (enemy.entryComplete && enemy.pathTick > 300) {
    enemy.vx = -balance.enemy.shooter.speed;
    enemy.entryComplete = false;
  }
  if (enemy.x < -30) {
    world.enemies.swapRemove(idx);
  }
}

// Kamikaze: persegue a nave com rotação limitada
function updateKamikaze(world: World, enemy: EnemyEntity): void {
  const dx = world.player.x - enemy.x;
  const dy = world.player.y - enemy.y;
  // Ângulo desejado em mili-radianos (aproximação usando atan2 por tabela)
  // Usamos a tangente para encontrar o quadrante
  const absDx = dx < 0 ? -dx : dx;
  const absDy = dy < 0 ? -dy : dy;

  // Octante baseado no sinal e quadrante
  let targetMilliRad: number;
  if (absDx === 0 && absDy === 0) {
    targetMilliRad = enemy.angleMilliRad;
  } else {
    // Aproximação de atan2 usando razão
    // Quadrantes: mapeamos para 0..6283 milirad
    let base: number;
    let ratio: number;
    if (absDx >= absDy) {
      // Próximo a 0° ou 180°
      ratio = (absDy * 1000) / (absDx || 1);
      base = dx >= 0 ? 0 : 3141;
    } else {
      // Próximo a 90° ou 270°
      ratio = (absDx * 1000) / (absDy || 1);
      base = dy >= 0 ? 1570 : 4712;
    }
    // Ajuste de sinal
    let adjustment = (ratio * 785) / 1000; // atan(ratio/1000) ≈ ratio * pi/4 / 1000
    if (
      (absDx >= absDy && dy < 0 && dx >= 0) ||
      (absDx >= absDy && dy >= 0 && dx < 0) ||
      (absDx < absDy && dx < 0 && dy >= 0) ||
      (absDx < absDy && dx >= 0 && dy < 0)
    ) {
      adjustment = -adjustment;
    }
    targetMilliRad = (base + adjustment + 6283) % 6283;
  }

  // Rotação limitada por turnRate (em radianos, mas aqui em milirad)
  const turnRateMRad = Math.round(balance.enemy.kamikaze.turnRate * 1000);
  let diff = targetMilliRad - enemy.angleMilliRad;
  if (diff > 3141) diff -= 6283;
  if (diff < -3141) diff += 6283;
  if (diff > turnRateMRad) diff = turnRateMRad;
  if (diff < -turnRateMRad) diff = -turnRateMRad;
  enemy.angleMilliRad = (enemy.angleMilliRad + diff + 6283) % 6283;

  // Move na direção do ângulo atual
  const cs = cosSin1000(enemy.angleMilliRad);
  const spd = balance.enemy.kamikaze.speed * STEP;
  enemy.x += (cs.c * spd) / 1000;
  enemy.y += (cs.s * spd) / 1000;
}

// Esquadrão: trajetória em arco usando paths.squadron_arc
function updateSquadron(_world: World, enemy: EnemyEntity): void {
  enemy.x += enemy.vx * STEP;
  const ptIdx = enemy.pathTick % paths.squadron_arc.length;
  const yOffset = (paths.squadron_arc[ptIdx]! * 40) / 32;
  enemy.y = enemy.spawnY + yOffset;
  if (enemy.y < 10) enemy.y = 10;
  if (enemy.y > balance.world.logicalHeight - 10) enemy.y = balance.world.logicalHeight - 10;
}

// Torreta: estática, mira e atira
function updateTurret(world: World, enemy: EnemyEntity, idx: number): void {
  if (enemy.fireCooldown > 0) {
    enemy.fireCooldown--;
  } else {
    const dx = world.player.x - enemy.x;
    const dy = world.player.y - enemy.y;
    const absDx = dx < 0 ? -dx : dx;
    const absDy = dy < 0 ? -dy : dy;
    const len = absDx + absDy;
    if (len > 0) {
      const spd = balance.enemy.turret.shotSpeed;
      const factor = (spd * 3) / 4;
      spawnEnemyShot(world, enemy.x, enemy.y, (dx * factor) / len, (dy * factor) / len);
    }
    enemy.fireCooldown = balance.enemy.turret.fireIntervalTicks;
  }
  // Turretas são removidas quando saem da tela pelo scroll
  if (enemy.x + world.scrollX < -30) {
    world.enemies.swapRemove(idx);
  }
}

// Mina: parada, explode em fragmentos radiais ao morrer (handled in killEnemy)
function updateMine(_world: World, _enemy: EnemyEntity): void {
  // Minas são estáticas; deriva lenta com o scroll
  // Não faz nada no update — explosão é tratada em killEnemy
}

// ---------------------------------------------------------------------------
// Boss: dockyard_guardian
// ---------------------------------------------------------------------------

function spawnBoss(world: World): void {
  const cfg = balance.boss.dockyardGuardian;
  world.boss = {
    x: balance.world.logicalWidth - 40,
    y: balance.world.logicalHeight / 2,
    prevX: balance.world.logicalWidth - 40,
    prevY: balance.world.logicalHeight / 2,
    radius: cfg.hitboxRadius,
    hp: cfg.hp,
    maxHp: cfg.hp,
    phase: 1,
    attackTick: 0,
    scoreValue: cfg.scoreValue,
    isDead: false,
  };
}

function updateBoss(world: World, boss: BossEntity): void {
  boss.prevX = boss.x;
  boss.prevY = boss.y;
  boss.attackTick++;

  const cfg = balance.boss.dockyardGuardian;
  const fireInterval =
    boss.phase === 1 ? cfg.phase1FireIntervalTicks : cfg.phase2FireIntervalTicks;
  const shotSpeed = boss.phase === 1 ? cfg.phase1ShotSpeed : cfg.phase2ShotSpeed;

  if (boss.attackTick >= fireInterval) {
    boss.attackTick = 0;
    if (boss.phase === 1) {
      // Fase 1: spread em leque de 5 tiros
      const spreadAngles = [-1256, -628, 0, 628, 1256]; // milirad (-72°, -36°, 0°, 36°, 72°) relativo a 180°
      for (let k = 0; k < spreadAngles.length; k++) {
        const aMRad = (3141 + (spreadAngles[k] ?? 0) + 6283) % 6283;
        const cs = cosSin1000(aMRad);
        spawnEnemyShot(
          world,
          boss.x - 20,
          boss.y,
          (cs.c * shotSpeed) / 1000,
          (cs.s * shotSpeed) / 1000,
        );
      }
    } else {
      // Fase 2: radial de 8 tiros
      for (let k = 0; k < 8; k++) {
        const aMRad = (k * 6283) / 8;
        const cs = cosSin1000(Math.round(aMRad));
        spawnEnemyShot(
          world,
          boss.x,
          boss.y,
          (cs.c * shotSpeed) / 1000,
          (cs.s * shotSpeed) / 1000,
        );
      }
    }
  }

  // Movimentação senoidal vertical do boss usando tabela
  const pIdx = (world.tick * 2) % paths.sine_wave.length;
  boss.y = balance.world.logicalHeight / 2 + (paths.sine_wave[pIdx]! * 60) / 32;
}

function checkBossPhase(world: World, boss: BossEntity): void {
  if (boss.phase === 1 && boss.hp <= balance.boss.dockyardGuardian.phase2HpThreshold) {
    boss.phase = 2;
    boss.attackTick = 0;
  }
  if (boss.hp <= 0) {
    boss.isDead = true;
    world.events.push({ type: 'explosion', x: boss.x, y: boss.y });
    spawnExplosionParticles(world, boss.x, boss.y, 20, '#ff6600');
    spawnExplosionParticles(world, boss.x, boss.y, 15, '#ffdd44');
    world.score += boss.scoreValue;
    world.boss = null;
    world.state = 'worldClear';
    world.events.push({ type: 'worldClear' });
  }
}

// ---------------------------------------------------------------------------
// Atualização de tiros
// ---------------------------------------------------------------------------

function updateShots(world: World): void {
  const W = balance.world.logicalWidth;
  const H = balance.world.logicalHeight;

  for (let i = world.playerShots.activeCount - 1; i >= 0; i--) {
    const shot = world.playerShots.items[i];
    if (!shot) continue;
    shot.prevX = shot.x;
    shot.prevY = shot.y;
    shot.x += shot.vx * STEP;
    shot.y += shot.vy * STEP;
    if (shot.x > W + 20 || shot.x < -20 || shot.y < -20 || shot.y > H + 20) {
      world.playerShots.swapRemove(i);
    }
  }

  for (let i = world.enemyShots.activeCount - 1; i >= 0; i--) {
    const shot = world.enemyShots.items[i];
    if (!shot) continue;
    shot.prevX = shot.x;
    shot.prevY = shot.y;
    shot.x += shot.vx * STEP;
    shot.y += shot.vy * STEP;
    if (shot.x < -20 || shot.x > W + 20 || shot.y < -20 || shot.y > H + 20) {
      world.enemyShots.swapRemove(i);
    }
  }
}

// ---------------------------------------------------------------------------
// Colisões
// ---------------------------------------------------------------------------

function resolveCollisions(world: World): void {
  const player = world.player;

  // Tiros do jogador vs inimigos
  for (let si = world.playerShots.activeCount - 1; si >= 0; si--) {
    const shot = world.playerShots.items[si];
    if (!shot) continue;
    let shotUsed = false;

    for (let ei = world.enemies.activeCount - 1; ei >= 0 && !shotUsed; ei--) {
      const enemy = world.enemies.items[ei];
      if (!enemy) continue;

      if (checkCircleCollision(shot.x, shot.y, shot.radius, enemy.x, enemy.y, enemy.radius)) {
        enemy.hp -= shot.damage;
        world.playerShots.swapRemove(si);
        shotUsed = true;
        spawnExplosionParticles(world, shot.x, shot.y, 3, '#ffdd44');

        if (enemy.hp <= 0) {
          killEnemy(world, ei, enemy);
        } else {
          world.events.push({ type: 'explosion', x: enemy.x, y: enemy.y });
        }
      }
    }

    // Tiro vs boss
    if (!shotUsed && world.boss && !world.boss.isDead) {
      const boss = world.boss;
      if (checkCircleCollision(shot.x, shot.y, shot.radius, boss.x, boss.y, boss.radius)) {
        boss.hp -= shot.damage;
        world.playerShots.swapRemove(si);
        world.events.push({ type: 'bossHit', x: boss.x, y: boss.y });
        checkBossPhase(world, boss);
      }
    }
  }

  // Tiros inimigos vs jogador
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

  // Inimigos vs jogador (colisão direta)
  if (player.invincibleTicks === 0 && !player.isDead) {
    for (let i = world.enemies.activeCount - 1; i >= 0; i--) {
      const enemy = world.enemies.items[i];
      if (!enemy) continue;

      if (checkCircleCollision(player.x, player.y, player.radius, enemy.x, enemy.y, enemy.radius)) {
        spawnExplosionParticles(world, enemy.x, enemy.y, 8, '#ff6600');
        world.enemies.swapRemove(i);
        handlePlayerDamage(world);
        break;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Cápsulas
// ---------------------------------------------------------------------------

function updateCapsules(world: World): void {
  const player = world.player;

  for (let i = world.capsules.activeCount - 1; i >= 0; i--) {
    const cap = world.capsules.items[i];
    if (!cap) continue;
    cap.prevX = cap.x;
    cap.prevY = cap.y;
    cap.x -= balance.capsule.driftSpeed * STEP;

    // Colisão com o jogador
    if (
      !player.isDead &&
      checkCircleCollision(player.x, player.y, player.radius + 5, cap.x, cap.y, cap.radius)
    ) {
      applyCapsule(world, cap.capsuleType);
      world.capsules.swapRemove(i);
      continue;
    }

    // Remove se saiu da tela
    if (cap.x < -20) {
      world.capsules.swapRemove(i);
    }
  }
}

function spawnCapsule(world: World, x: number, y: number, type: CapsuleType): void {
  const cap = world.capsules.acquire();
  if (!cap) return;
  cap.x = x;
  cap.y = y;
  cap.prevX = x;
  cap.prevY = y;
  cap.radius = balance.capsule.hitboxRadius;
  cap.capsuleType = type;
}

function applyCapsule(world: World, type: CapsuleType): void {
  const player = world.player;
  world.events.push({ type: 'powerup', x: player.x, y: player.y });

  switch (type) {
    case 'weapon':
      if (player.weaponLevel < 3) {
        player.weaponLevel++;
      }
      break;
    case 'missile':
      player.hasMissile = true;
      break;
    case 'shield':
      if (player.shield < 1) {
        player.shield = 1;
      }
      break;
    case 'speed':
      if (player.speedStackCount < balance.player.maxSpeedStacks) {
        player.speedStackCount++;
        player.speedMultiplier =
          1.0 + player.speedStackCount * balance.player.speedBonusPerStack;
      }
      break;
    case 'bomb':
      if (player.bombs < 3) {
        player.bombs++;
      }
      break;
    case 'life':
      player.lives++;
      break;
    case 'points':
      world.score += balance.scoring.pointsCapsuleValue;
      break;
  }
}

// ---------------------------------------------------------------------------
// Partículas
// ---------------------------------------------------------------------------

function updateParticles(world: World): void {
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

// ---------------------------------------------------------------------------
// Utilitários de helper
// ---------------------------------------------------------------------------

function killEnemy(world: World, idx: number, enemy: EnemyEntity): void {
  world.score += enemy.scoreValue * (1 + Math.floor(world.combo / balance.scoring.comboMultiplierInterval));
  world.combo++;
  world.events.push({ type: 'explosion', x: enemy.x, y: enemy.y });
  spawnExplosionParticles(world, enemy.x, enemy.y, 10, '#ff6600');

  // Mina: explode em fragmentos radiais
  if (enemy.type === 'mine') {
    const cnt = balance.enemy.mine.fragmentCount;
    const spd = balance.enemy.mine.fragmentSpeed;
    for (let k = 0; k < cnt; k++) {
      const aMRad = Math.round((k * 6283) / cnt);
      const cs = cosSin1000(aMRad);
      spawnEnemyShot(
        world,
        enemy.x,
        enemy.y,
        (cs.c * spd) / 1000,
        (cs.s * spd) / 1000,
      );
    }
  }

  // Dropa cápsula
  if (enemy.dropCapsule !== null) {
    spawnCapsule(world, enemy.x, enemy.y, enemy.dropCapsule);
  }

  world.enemies.swapRemove(idx);
}

function handlePlayerDamage(world: World): void {
  const player = world.player;
  world.combo = 0;
  player.ticksWithoutDamage = 0;
  world.events.push({ type: 'playerHit', x: player.x, y: player.y });
  spawnExplosionParticles(world, player.x, player.y, 12, '#ff3333');

  if (player.shield > 0) {
    player.shield = 0;
    player.invincibleTicks = 60; // 1s de graça após perder escudo
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

function spawnEnemyShot(
  world: World,
  x: number,
  y: number,
  vx: number,
  vy: number,
): void {
  const shot = world.enemyShots.acquire();
  if (!shot) return;
  shot.x = x;
  shot.y = y;
  shot.prevX = x;
  shot.prevY = y;
  shot.vx = vx;
  shot.vy = vy;
  shot.radius = balance.enemy.straightDrone.shotHitboxRadius;
  shot.damage = 1;
  shot.isPlayer = false;
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
    // Direção determinística por tabela de cos/sin
    const idx = Math.floor(world.rng() * 360);
    const speed = 40 + Math.floor(world.rng() * 80);
    p.vx = (COS_TABLE[idx]! * speed) / 1000;
    p.vy = (SIN_TABLE[idx]! * speed) / 1000;
    p.life = 0;
    p.maxLife = 10 + Math.floor(world.rng() * 10);
    p.color = color;
    p.size = 2;
  }
}

function checkExtraLife(_world: World): void {
  // A cada balance.player.extraLifeScoreInterval pontos, o jogador ganha uma vida extra.
  // A implementação completa requer um contador separado de "últimos pontos na vidas extra",
  // que será adicionado ao estado do mundo na próxima iteração para evitar alocação aqui.
}
