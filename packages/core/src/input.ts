/**
 * Bitmask flags for input buttons.
 */
export const BUTTON_FIRE = 1;
export const BUTTON_BOMB = 2;

/**
 * Normalized input representation for a single simulation step.
 * Axes are integers ranging from -127 to 127.
 */
export interface Input {
  moveX: number; // inteiro de -127 a 127
  moveY: number; // inteiro de -127 a 127
  buttons: number; // bitmask: 1 = fire, 2 = bomb
}

/**
 * Creates an empty, idle input.
 */
export function createEmptyInput(): Input {
  return {
    moveX: 0,
    moveY: 0,
    buttons: 0,
  };
}
