/**
 * Version of the core deterministic simulation rules.
 * Must be bumped whenever game logic changes in ways that affect replay outcomes.
 */
export const CORE_VERSION = '0.1.0';

/**
 * Fixed step delta time (1/60th of a second).
 */
export const STEP = 1 / 60;

/**
 * Simple placeholder check for core package initialization.
 */
export function getCoreInfo(): { version: string; step: number } {
  return {
    version: CORE_VERSION,
    step: STEP,
  };
}
