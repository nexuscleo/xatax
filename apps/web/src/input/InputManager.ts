import type { Input } from '@vanguarda/core';
import { BUTTON_BOMB, BUTTON_FIRE } from '@vanguarda/core';

export class InputManager {
  private keys: Set<string> = new Set();
  public autoFire = false;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  getInput(): Input {
    let moveX = 0;
    let moveY = 0;
    let buttons = 0;

    // Keyboard controls
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) {
      moveX -= 127;
    }
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) {
      moveX += 127;
    }
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) {
      moveY -= 127;
    }
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) {
      moveY += 127;
    }
    if (this.keys.has('Space') || this.keys.has('KeyZ') || this.autoFire) {
      buttons |= BUTTON_FIRE;
    }
    if (this.keys.has('KeyX')) {
      buttons |= BUTTON_BOMB;
    }

    // Gamepad support
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = gamepads[0];
    if (gp) {
      const deadzone = 0.15;
      const axisX = gp.axes[0] ?? 0;
      const axisY = gp.axes[1] ?? 0;

      if (Math.abs(axisX) > deadzone) {
        moveX = Math.round(axisX * 127);
      }
      if (Math.abs(axisY) > deadzone) {
        moveY = Math.round(axisY * 127);
      }

      if (gp.buttons[0]?.pressed) {
        buttons |= BUTTON_FIRE; // Button A
      }
      if (gp.buttons[1]?.pressed) {
        buttons |= BUTTON_BOMB; // Button B
      }
    }

    return {
      moveX: Math.max(-127, Math.min(127, moveX)),
      moveY: Math.max(-127, Math.min(127, moveY)),
      buttons,
    };
  }
}
