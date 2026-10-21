export interface BalanceConfig {
  world: {
    logicalWidth: number;
    logicalHeight: number;
    tileSize: number;
    defaultScrollSpeed: number;
  };
  player: {
    hitboxRadius: number;
    speed: number;
    initialLives: {
      easy: number;
      normal: number;
      hard: number;
    };
    invincibilityTicks: number;
    fireCadenceTicks: number;
    shotSpeed: number;
    shotHitboxRadius: number;
    shotDamage: number;
    extraLifeScoreInterval: number;
  };
  enemy: {
    straightDrone: {
      hp: number;
      speed: number;
      hitboxRadius: number;
      scoreValue: number;
      shotSpeed: number;
      shotHitboxRadius: number;
      fireIntervalTicks: number;
    };
  };
  pools: {
    maxPlayerShots: number;
    maxEnemyShots: number;
    maxEnemies: number;
    maxParticles: number;
  };
}

export const balance: BalanceConfig = {
  world: {
    logicalWidth: 480,
    logicalHeight: 270,
    tileSize: 16,
    defaultScrollSpeed: 40,
  },
  player: {
    hitboxRadius: 5,
    speed: 140,
    initialLives: {
      easy: 4,
      normal: 3,
      hard: 3,
    },
    invincibilityTicks: 120, // 2s * 60 FPS
    fireCadenceTicks: 10, // 6 tiros/s => 60 / 6 = 10 ticks
    shotSpeed: 300,
    shotHitboxRadius: 3,
    shotDamage: 1,
    extraLifeScoreInterval: 50000,
  },
  enemy: {
    straightDrone: {
      hp: 1,
      speed: 80,
      hitboxRadius: 8,
      scoreValue: 100,
      shotSpeed: 120,
      shotHitboxRadius: 3,
      fireIntervalTicks: 90,
    },
  },
  pools: {
    maxPlayerShots: 150,
    maxEnemyShots: 150,
    maxEnemies: 50,
    maxParticles: 200,
  },
};
