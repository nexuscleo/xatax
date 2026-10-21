export interface AssetManifest {
  sprites?: Record<string, unknown>;
  audio?: Record<string, unknown>;
}

export interface DrawSpriteOptions {
  rot?: number;
  alpha?: number;
  flipX?: boolean;
}

/**
 * Platform-agnostic contract for graphics rendering.
 * Implemented by CanvasRenderer (Web) and SkiaRenderer (Mobile).
 */
export interface Renderer {
  loadAssets(manifest: AssetManifest): Promise<void>;
  begin(logicalW: number, logicalH: number): void;
  drawSprite(id: string, x: number, y: number, o?: DrawSpriteOptions): void;
  drawRect(x: number, y: number, w: number, h: number, color: string): void;
  drawText(text: string, x: number, y: number, size: number, color?: string): void;
  end(): void;
}
