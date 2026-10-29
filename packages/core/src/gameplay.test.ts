import { balance, paths, type CapsuleType } from '@vanguarda/content';
import { describe, expect, it } from 'vitest';
import { BUTTON_BOMB, BUTTON_FIRE, createWorld, step } from './index';
import type { EnemyEntity, World } from './world';

const EMPTY_INPUT = { moveX: 0, moveY: 0, buttons: 0 };

function addEnemy(world: World, type: EnemyEntity['type'], overrides = {}): EnemyEntity {
  const enemy = world.enemies.acquire();
  if (!enemy) throw new Error('Enemy pool is full');
  Object.assign(
    enemy,
    {
      id: 1,
      type,
      x: 300,
      y: 80,
      spawnY: 80,
      prevX: 300,
      prevY: 80,
      vx: 0,
      vy: 0,
      radius: 8,
      hp: 1,
      fireCooldown: 100,
      scoreValue: 100,
      pathTick: 0,
      pathId: 'sine_wave',
      angleMilliRad: 0,
      entryX: 350,
      entryComplete: false,
      dropCapsule: null,
    },
    overrides,
  );
  return enemy;
}

function addPlayerShot(world: World, x: number, y: number): void {
  const shot = world.playerShots.acquire();
  if (!shot) throw new Error('Player shot pool is full');
  Object.assign(shot, {
    x,
    y,
    prevX: x,
    prevY: y,
    vx: 0,
    vy: 0,
    radius: 3,
    damage: 1,
    isPlayer: true,
  });
}

function addEnemyShotAtPlayer(world: World): void {
  const shot = world.enemyShots.acquire();
  if (!shot) throw new Error('Enemy shot pool is full');
  Object.assign(shot, {
    x: world.player.x,
    y: world.player.y,
    prevX: world.player.x,
    prevY: world.player.y,
    vx: 0,
    vy: 0,
    radius: 3,
    damage: 1,
    isPlayer: false,
  });
}

function addBoss(world: World, hp: number): void {
  world.boss = {
    x: 200,
    y: 135,
    prevX: 200,
    prevY: 135,
    radius: 30,
    hp,
    maxHp: hp,
    phase: 1,
    attackTick: 0,
    scoreValue: balance.boss.dockyardGuardian.scoreValue,
    isDead: false,
  };
}

function bossYOnNextStep(world: World): number {
  const pathIndex = ((world.tick + 1) * 2) % paths.sine_wave.length;
  return balance.world.logicalHeight / 2 + (paths.sine_wave[pathIndex]! * 60) / 32;
}

describe('World 1 gameplay rules', () => {
  it('uses the configured trajectory table for wave enemies', () => {
    const world = createWorld(1);
    world.tick = world.levelData.waves[4]!.tick - 1;
    world.waveIndex = 4;

    step(world, EMPTY_INPUT);

    const enemy = world.enemies.items[0]!;
    expect(enemy.type).toBe('zigzag_drone');
    expect(enemy.pathId).toBe('zigzag');
    expect(enemy.pathTick).toBe(1);
    expect(enemy.y).toBe(
      enemy.spawnY +
        (paths.zigzag[1]! * balance.enemy.zigzagDrone.stepSize) /
          balance.enemy.zigzagDrone.pathValueScale,
    );
  });

  it('supports the reactor sentinel boss progression for world 2', () => {
    const world = createWorld(7, 'world-2', 'normal');
    world.tick = world.levelData.boss.tick - 1;
    world.waveIndex = world.levelData.waves.length;
    step(world, EMPTY_INPUT);

    expect(world.boss).not.toBeNull();
    expect(world.boss?.phase).toBe(1);
    expect(world.boss?.maxHp).toBeGreaterThan(balance.boss.dockyardGuardian.hp);

    world.boss!.hp = balance.boss.reactorSentinel.phase2HpThreshold - 1;
    world.boss!.phase = 1;
    addPlayerShot(world, world.boss!.x - 2, world.boss!.y);
    step(world, EMPTY_INPUT);

    expect(world.boss!.phase).toBe(2);
  });

  it('damages the player on walls while allowing passage through the narrow gap', () => {
    const collidingWorld = createWorld(1);
    collidingWorld.player.invincibleTicks = 0;
    collidingWorld.player.y = 24;
    collidingWorld.scrollX = 220 * balance.world.tileSize - collidingWorld.player.x;

    step(collidingWorld, EMPTY_INPUT);

    expect(collidingWorld.player.lives).toBe(2);
    expect(collidingWorld.player.hasTakenDamage).toBe(true);

    const passageWorld = createWorld(2);
    passageWorld.player.invincibleTicks = 0;
    passageWorld.player.y = 136;
    passageWorld.scrollX = 220 * balance.world.tileSize - passageWorld.player.x;

    step(passageWorld, EMPTY_INPUT);

    expect(passageWorld.player.lives).toBe(3);
    expect(passageWorld.player.hasTakenDamage).toBe(false);
  });

  it('changes enemy health and movement speed by difficulty', () => {
    const easy = createWorld(1, 'world-1', 'easy');
    const hard = createWorld(1, 'world-1', 'hard');

    for (let tick = 0; tick < 60; tick++) {
      step(easy, EMPTY_INPUT);
      step(hard, EMPTY_INPUT);
    }

    expect(easy.enemies.items[0]?.hp).toBe(1);
    expect(hard.enemies.items[0]?.hp).toBe(2);
    expect(Math.abs(hard.enemies.items[0]!.vx)).toBeGreaterThan(
      Math.abs(easy.enemies.items[0]!.vx),
    );
    expect(easy.player.lives).toBe(4);
    expect(hard.player.lives).toBe(3);
  });

  it('scales turret projectile speed once at the difficulty boundary', () => {
    const world = createWorld(1, 'world-1', 'hard');
    addEnemy(world, 'turret', { x: 300, y: 80, fireCooldown: 0 });

    step(world, EMPTY_INPUT);

    const shot = world.enemyShots.items[0]!;
    expect(Math.abs(shot.vx) + Math.abs(shot.vy)).toBeCloseTo(
      balance.enemy.turret.shotSpeed * 0.75 * balance.difficulty.hard.enemyShotSpeedMultiplier,
    );
  });

  it('uses an absorbed shield hit to reset combo without losing a life', () => {
    const world = createWorld(2);
    world.player.invincibleTicks = 0;
    world.player.shield = 1;
    world.combo = 7;
    addEnemyShotAtPlayer(world);

    step(world, EMPTY_INPUT);

    expect(world.player.shield).toBe(0);
    expect(world.player.lives).toBe(3);
    expect(world.player.hasTakenDamage).toBe(true);
    expect(world.combo).toBe(0);
  });

  it('loses one life and one weapon level when hit without a shield', () => {
    const world = createWorld(3);
    world.player.invincibleTicks = 0;
    world.player.weaponLevel = 3;
    addEnemyShotAtPlayer(world);

    step(world, EMPTY_INPUT);

    expect(world.player.lives).toBe(2);
    expect(world.player.weaponLevel).toBe(2);
    expect(world.player.invincibleTicks).toBe(balance.player.invincibilityTicks);
  });

  it.each([
    ['weapon', (world: World) => expect(world.player.weaponLevel).toBe(2)],
    ['missile', (world: World) => expect(world.player.hasMissile).toBe(true)],
    ['shield', (world: World) => expect(world.player.shield).toBe(1)],
    [
      'speed',
      (world: World) => {
        expect(world.player.speedStackCount).toBe(1);
        expect(world.player.speedMultiplier).toBeCloseTo(1.1);
      },
    ],
    ['bomb', (world: World) => expect(world.player.bombs).toBe(3)],
    ['life', (world: World) => expect(world.player.lives).toBe(4)],
    ['points', (world: World) => expect(world.score).toBe(1200)],
  ] as const)(
    'applies the %s capsule effect and collection score',
    (type: CapsuleType, verify: (world: World) => void) => {
      const world = createWorld(4);
      if (type === 'bomb') world.player.bombs = 2;
      const capsule = world.capsules.acquire();
      if (!capsule) throw new Error('Capsule pool is full');
      Object.assign(capsule, {
        x: world.player.x,
        y: world.player.y,
        prevX: world.player.x,
        prevY: world.player.y,
        radius: balance.capsule.hitboxRadius,
        capsuleType: type,
      });

      step(world, EMPTY_INPUT);

      expect(world.capsulesCollected).toBe(1);
      expect(world.score).toBe(
        balance.scoring.capsuleBonus + (type === 'points' ? balance.scoring.pointsCapsuleValue : 0),
      );
      verify(world);
    },
  );

  it('spawns a configured drop when its enemy is destroyed', () => {
    const world = createWorld(5);
    addEnemy(world, 'straight_drone', { dropCapsule: 'weapon' });
    addPlayerShot(world, 300, 80);

    step(world, EMPTY_INPUT);

    expect(world.enemies.activeCount).toBe(0);
    expect(world.capsules.activeCount).toBe(1);
    expect(world.capsules.items[0]?.capsuleType).toBe('weapon');
    expect(world.combo).toBe(1);
  });

  it('clears hostile shots and damages enemies once per bomb press', () => {
    const world = createWorld(6);
    const enemy = addEnemy(world, 'straight_drone');
    enemy.x = 300;
    enemy.hp = 1;
    addEnemyShotAtPlayer(world);

    step(world, { moveX: 0, moveY: 0, buttons: BUTTON_BOMB });

    expect(world.player.bombs).toBe(2);
    expect(world.enemyShots.activeCount).toBe(0);
    expect(world.enemies.activeCount).toBe(0);
  });

  it('applies the combo score multiplier after each configured kill streak', () => {
    const world = createWorld(6);
    for (let i = 0; i <= balance.scoring.comboMultiplierInterval; i++) {
      addEnemy(world, 'straight_drone', { id: i, x: 300, y: 80 });
      addPlayerShot(world, 300, 80);
    }

    step(world, EMPTY_INPUT);

    expect(world.enemies.activeCount).toBe(0);
    expect(world.combo).toBe(balance.scoring.comboMultiplierInterval + 1);
    expect(world.score).toBe(1200);
  });

  it('limits collected speed stacks, weapon level, shield and bombs', () => {
    const world = createWorld(7);
    world.player.speedStackCount = balance.player.maxSpeedStacks;
    world.player.speedMultiplier =
      1 + balance.player.maxSpeedStacks * balance.player.speedBonusPerStack;
    world.player.weaponLevel = 3;
    world.player.shield = 1;
    world.player.bombs = 3;
    const capsuleTypes: CapsuleType[] = ['speed', 'weapon', 'shield', 'bomb'];

    for (let i = 0; i < capsuleTypes.length; i++) {
      const capsule = world.capsules.acquire();
      if (!capsule) throw new Error('Capsule pool is full');
      Object.assign(capsule, {
        x: world.player.x,
        y: world.player.y,
        prevX: world.player.x,
        prevY: world.player.y,
        radius: balance.capsule.hitboxRadius,
        capsuleType: capsuleTypes[i]!,
      });
    }

    step(world, EMPTY_INPUT);

    expect(world.player.speedStackCount).toBe(balance.player.maxSpeedStacks);
    expect(world.player.weaponLevel).toBe(3);
    expect(world.player.shield).toBe(1);
    expect(world.player.bombs).toBe(3);
  });

  it('fires the correct number of shots for weapon and missile combinations', () => {
    const volleys = [
      { weaponLevel: 1, hasMissile: false, expected: 1 },
      { weaponLevel: 2, hasMissile: false, expected: 2 },
      { weaponLevel: 3, hasMissile: false, expected: 3 },
      { weaponLevel: 3, hasMissile: true, expected: 5 },
    ];

    for (const volley of volleys) {
      const world = createWorld(7);
      world.player.weaponLevel = volley.weaponLevel;
      world.player.hasMissile = volley.hasMissile;

      step(world, { moveX: 0, moveY: 0, buttons: BUTTON_FIRE });

      expect(world.playerShots.activeCount).toBe(volley.expected);
    }
  });

  it('emits radial fragments when a mine is destroyed', () => {
    const world = createWorld(8);
    addEnemy(world, 'mine', { hp: 1 });
    addPlayerShot(world, 300, 80);

    step(world, EMPTY_INPUT);

    expect(world.enemyShots.activeCount).toBe(balance.enemy.mine.fragmentCount);
  });

  it('transitions the boss through phase two and awards completion bonuses', () => {
    const world = createWorld(9);
    world.waveIndex = world.levelData.waves.length;
    world.tick = 100;
    addBoss(world, balance.boss.dockyardGuardian.phase2HpThreshold + 1);
    addPlayerShot(world, 200, bossYOnNextStep(world));

    step(world, EMPTY_INPUT);

    expect(world.boss?.hp).toBe(balance.boss.dockyardGuardian.phase2HpThreshold);
    expect(world.boss?.phase).toBe(2);

    const victoryWorld = createWorld(10);
    victoryWorld.waveIndex = victoryWorld.levelData.waves.length;
    victoryWorld.tick = 100;
    addBoss(victoryWorld, 1);
    addPlayerShot(victoryWorld, 200, bossYOnNextStep(victoryWorld));

    step(victoryWorld, EMPTY_INPUT);

    expect(victoryWorld.state).toBe('worldClear');
    expect(victoryWorld.score).toBe(
      balance.boss.dockyardGuardian.scoreValue +
        balance.scoring.worldCompleteBonus +
        balance.scoring.noDamageBonus,
    );
  });

  it('fires the configured five-shot and eight-shot boss patterns', () => {
    const phaseOne = createWorld(10);
    phaseOne.waveIndex = phaseOne.levelData.waves.length;
    phaseOne.tick = 100;
    addBoss(phaseOne, 80);
    phaseOne.boss!.attackTick = balance.boss.dockyardGuardian.phase1FireIntervalTicks - 1;

    step(phaseOne, EMPTY_INPUT);

    expect(phaseOne.enemyShots.activeCount).toBe(5);

    const phaseTwo = createWorld(11);
    phaseTwo.waveIndex = phaseTwo.levelData.waves.length;
    phaseTwo.tick = 100;
    addBoss(phaseTwo, 40);
    phaseTwo.boss!.phase = 2;
    phaseTwo.boss!.attackTick = balance.boss.dockyardGuardian.phase2FireIntervalTicks - 1;

    step(phaseTwo, EMPTY_INPUT);

    expect(phaseTwo.enemyShots.activeCount).toBe(8);
  });

  it('does not award the no-damage bonus after the player was hit', () => {
    const world = createWorld(12);
    world.waveIndex = world.levelData.waves.length;
    world.tick = 100;
    world.player.hasTakenDamage = true;
    addBoss(world, 1);
    addPlayerShot(world, 200, bossYOnNextStep(world));

    step(world, EMPTY_INPUT);

    expect(world.state).toBe('worldClear');
    expect(world.score).toBe(
      balance.boss.dockyardGuardian.scoreValue + balance.scoring.worldCompleteBonus,
    );
  });

  it('grants each extra life threshold crossed by the score', () => {
    const world = createWorld(13);
    world.score = 110000;

    step(world, EMPTY_INPUT);

    expect(world.player.lives).toBe(5);
    expect(world.nextExtraLifeScore).toBe(150000);
    expect(world.events.filter((event) => event.type === 'extraLife')).toHaveLength(2);
  });
});
