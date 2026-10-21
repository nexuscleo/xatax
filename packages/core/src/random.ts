/**
 * Seeded PRNG using the Mulberry32 algorithm.
 * Guarantees exact determinism across V8 (Node.js/Chrome) and Hermes (React Native).
 */
export function createRng(seed: number): () => number {
  let a = seed >>> 0 || 1;
  return function next(): number {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
