import { describe, expect, it } from 'vitest';
import { CORE_VERSION, STEP, getCoreInfo } from './index';

describe('@vanguarda/core initialization', () => {
  it('exposes fixed step of 1/60 seconds', () => {
    expect(STEP).toBeCloseTo(0.0166667, 5);
  });

  it('exposes semver CORE_VERSION', () => {
    expect(CORE_VERSION).toBe('0.1.0');
  });

  it('returns valid core info', () => {
    const info = getCoreInfo();
    expect(info.version).toBe(CORE_VERSION);
    expect(info.step).toBe(STEP);
  });
});
