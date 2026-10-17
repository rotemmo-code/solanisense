// Synthetic potato images, shared by make-fixtures.mjs (e2e uploads) and make-lighting-matrix.mjs (Task 12)
import { mkdirSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

export const SIZE = 256; // the width the app analyzes at
export const BROWN = [190, 150, 100], GREEN = [110, 160, 70]; // the skin and greening colors of the analyzer unit tests

// centered 57 px square: 4.96% of the image, but 9.87% of the analyzed ellipse (50.2% of the frame), just under WIDESPREAD 0.10, so do not enlarge it
const SIDE = Math.round(SIZE * Math.sqrt(0.05)), START = (SIZE - SIDE) >> 1;
export const inSpot = (x, y) => x >= START && x < START + SIDE && y >= START && y < START + SIDE;

/** Writes an opaque SIZE x SIZE PNG to a file URL; fill(x, y) returns integer [r, g, b] in 0..255 */
export function writePng(url, fill) {
  const png = new PNG({ width: SIZE, height: SIZE });
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) png.data.set([...fill(x, y), 255], 4 * (y * SIZE + x));
  mkdirSync(new URL('.', url), { recursive: true });
  writeFileSync(url, PNG.sync.write(png));
}
