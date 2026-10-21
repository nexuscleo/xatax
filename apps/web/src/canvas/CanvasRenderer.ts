import type { AssetManifest, DrawSpriteOptions, Renderer } from '@vanguarda/core';

export class CanvasRenderer implements Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D canvas context');
    }
    this.ctx = context;
  }

  async loadAssets(_manifest: AssetManifest): Promise<void> {
    // Phase 2 uses procedural shape placeholders
    return Promise.resolve();
  }

  begin(logicalW: number, logicalH: number): void {
    const dpr = window.devicePixelRatio || 1;
    const displayW = this.canvas.clientWidth;
    const displayH = this.canvas.clientHeight;

    const actualW = Math.floor(displayW * dpr);
    const actualH = Math.floor(displayH * dpr);

    if (this.canvas.width !== actualW || this.canvas.height !== actualH) {
      this.canvas.width = actualW;
      this.canvas.height = actualH;
    }

    const scaleX = actualW / logicalW;
    const scaleY = actualH / logicalH;
    this.scale = Math.min(scaleX, scaleY);

    this.offsetX = Math.floor((actualW - logicalW * this.scale) / 2);
    this.offsetY = Math.floor((actualH - logicalH * this.scale) / 2);

    this.ctx.save();
    // Fill letterbox border
    this.ctx.fillStyle = '#06080c';
    this.ctx.fillRect(0, 0, actualW, actualH);

    // Setup game viewport
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);

    // Disable image smoothing for crisp pixel art look
    this.ctx.imageSmoothingEnabled = false;

    // Viewport background
    this.ctx.fillStyle = '#0d1117';
    this.ctx.fillRect(0, 0, logicalW, logicalH);
  }

  drawRect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
  }

  drawSprite(_id: string, x: number, y: number, o?: DrawSpriteOptions): void {
    // Placeholder rectangle for sprites
    this.ctx.save();
    this.ctx.translate(x, y);
    if (o?.rot) {
      this.ctx.rotate(o.rot);
    }
    if (o?.alpha !== undefined) {
      this.ctx.globalAlpha = o.alpha;
    }
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(-8, -8, 16, 16);
    this.ctx.restore();
  }

  drawText(text: string, x: number, y: number, size: number, color = '#ffffff'): void {
    this.ctx.fillStyle = color;
    this.ctx.font = `${size}px monospace`;
    this.ctx.fillText(text, Math.floor(x), Math.floor(y));
  }

  end(): void {
    this.ctx.restore();
  }
}
