import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate pre-calculated point tables (offsets)
// 120 samples per cycle (2 seconds at 60 FPS)
const SAMPLES = 120;

// 1. Sine wave (smooth continuous oscillation of +- 30 pixels)
const sineWave = [];
for (let i = 0; i < SAMPLES; i++) {
  const angle = (i / SAMPLES) * Math.PI * 2;
  sineWave.push(Math.round(Math.sin(angle) * 32));
}

// 2. Zigzag (steps: up 32, down 32)
const zigzag = [];
for (let i = 0; i < SAMPLES; i++) {
  const phase = (i % 60) / 60;
  if (phase < 0.5) {
    zigzag.push(Math.round(-32 + phase * 4 * 32));
  } else {
    zigzag.push(Math.round(32 - (phase - 0.5) * 4 * 32));
  }
}

// 3. Squadron arc (enters right, dives down, swoops up)
const squadronArc = [];
for (let i = 0; i < SAMPLES; i++) {
  const t = i / SAMPLES;
  // Parabolic dive and climb
  const yOffset = Math.round(Math.sin(t * Math.PI) * 48);
  squadronArc.push(yOffset);
}

const paths = {
  sine_wave: sineWave,
  zigzag,
  squadron_arc: squadronArc,
};

const outputPath = path.resolve(__dirname, '../src/paths.json');
fs.writeFileSync(outputPath, JSON.stringify(paths, null, 2), 'utf-8');
console.log(`Generated paths.json with ${Object.keys(paths).length} trajectory tables.`);

