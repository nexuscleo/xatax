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
    bombCount: number;
    maxSpeedStacks: number;
    speedBonusPerStack: number;
  };
  weapons: {
    level2CadenceTicks: number;
    level3CadenceTicks: number;
    missileAngleDegrees: number;
  };
  capsule: {
    driftSpeed: number;
    hitboxRadius: number;
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
    waveDrone: {
      hp: number;
      speed: number;
      hitboxRadius: number;
      scoreValue: number;
      pathAmplitude: number;
    };
    zigzagDrone: {
      hp: number;
      speed: number;
      hitboxRadius: number;
      scoreValue: number;
      stepTicks: number;
      stepSize: number;
    };
    shooter: {
      hp: number;
      speed: number;
      hitboxRadius: number;
      scoreValue: number;
      shotSpeed: number;
      shotHitboxRadius: number;
      fireIntervalTicks: number;
      entryDistance: number;
    };
    kamikaze: {
      hp: number;
      speed: number;
      turnRate: number;
      hitboxRadius: number;
      scoreValue: number;
    };
    squadron: {
      hp: number;
      speed: number;
      hitboxRadius: number;
      scoreValue: number;
    };
    turret: {
      hp: number;
      hitboxRadius: number;
      scoreValue: number;
      shotSpeed: number;
      shotHitboxRadius: number;
      fireIntervalTicks: number;
    };
    mine: {
      hp: number;
      hitboxRadius: number;
      scoreValue: number;
      fragmentCount: number;
      fragmentSpeed: number;
    };
  };
  boss: {
    dockyardGuardian: {
      hp: number;
      hitboxRadius: number;
      scoreValue: number;
      phase1ShotSpeed: number;
      phase1FireIntervalTicks: number;
      phase2ShotSpeed: number;
      phase2FireIntervalTicks: number;
      phase2HpThreshold: number;
    };
  };
  scoring: {
    comboMultiplierInterval: number;
    worldCompleteBonus: number;
    noDamageBonus: number;
    capsuleBonus: number;
    pointsCapsuleValue: number;
  };
  pools: {
    maxPlayerShots: number;
    maxEnemyShots: number;
    maxEnemies: number;
    maxParticles: number;
    maxCapsules: number;
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
    bombCount: 3,
    maxSpeedStacks: 3,
    speedBonusPerStack: 0.1,
  },
  weapons: {
    level2CadenceTicks: 10, // same cadence, dual shots
    level3CadenceTicks: 12, // triple fan, slightly slower cadence
    missileAngleDegrees: 45,
  },
  capsule: {
    driftSpeed: 20, // pixels per second leftward
    hitboxRadius: 8,
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
    waveDrone: {
      hp: 1,
      speed: 75,
      hitboxRadius: 8,
      scoreValue: 120,
      pathAmplitude: 32,
    },
    zigzagDrone: {
      hp: 2,
      speed: 70,
      hitboxRadius: 8,
      scoreValue: 150,
      stepTicks: 30,
      stepSize: 32,
    },
    shooter: {
      hp: 3,
      speed: 60,
      hitboxRadius: 10,
      scoreValue: 250,
      shotSpeed: 140,
      shotHitboxRadius: 3,
      fireIntervalTicks: 70,
      entryDistance: 350, // stops at this X from left edge
    },
    kamikaze: {
      hp: 2,
      speed: 130,
      turnRate: 0.06, // radians per tick
      hitboxRadius: 7,
      scoreValue: 200,
    },
    squadron: {
      hp: 1,
      speed: 85,
      hitboxRadius: 7,
      scoreValue: 80,
    },
    turret: {
      hp: 4,
      hitboxRadius: 10,
      scoreValue: 300,
      shotSpeed: 130,
      shotHitboxRadius: 3,
      fireIntervalTicks: 80,
    },
    mine: {
      hp: 3,
      hitboxRadius: 10,
      scoreValue: 180,
      fragmentCount: 8,
      fragmentSpeed: 90,
    },
  },
  boss: {
    dockyardGuardian: {
      hp: 80,
      hitboxRadius: 30,
      scoreValue: 5000,
      phase1ShotSpeed: 130,
      phase1FireIntervalTicks: 60,
      phase2ShotSpeed: 160,
      phase2FireIntervalTicks: 40,
      phase2HpThreshold: 40, // switches phase at half HP
    },
  },
  scoring: {
    comboMultiplierInterval: 10, // every 10 consecutive kills = +1 multiplier
    worldCompleteBonus: 3000,
    noDamageBonus: 5000,
    capsuleBonus: 200,
    pointsCapsuleValue: 1000,
  },
  pools: {
    maxPlayerShots: 150,
    maxEnemyShots: 150,
    maxEnemies: 50,
    maxParticles: 200,
    maxCapsules: 20,
  },
};
