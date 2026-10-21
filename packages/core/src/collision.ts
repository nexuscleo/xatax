/**
 * Circle-to-circle collision check using squared distance.
 * Avoids Math.hypot / Math.sqrt to prevent cross-platform floating point divergence.
 */
export function checkCircleCollision(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number,
): boolean {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const rSum = r1 + r2;
  return dx * dx + dy * dy <= rSum * rSum;
}

/**
 * Checks if a circle intersects with an axis-aligned tile bounding box [tileX, tileY, size, size].
 */
export function checkCircleTileCollision(
  circleX: number,
  circleY: number,
  radius: number,
  tileX: number,
  tileY: number,
  tileSize: number,
): boolean {
  // Find closest point on tile rectangle
  const closestX = Math.max(tileX, Math.min(circleX, tileX + tileSize));
  const closestY = Math.max(tileY, Math.min(circleY, tileY + tileSize));

  const dx = circleX - closestX;
  const dy = circleY - closestY;

  return dx * dx + dy * dy <= radius * radius;
}
