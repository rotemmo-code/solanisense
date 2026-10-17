// Synthetic potato images, shared by make-fixtures.mjs (e2e uploads) and make-lighting-matrix.mjs (Task 12)
import { mkdirSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

export const SIZE = 256; // the width the app analyzes at
export const BROWN = [190, 150, 100], GREEN = [110, 160, 70]; // the skin and greening colors of the analyzer unit tests

/** A centered square covering `fraction` of the image area, its side rounded to whole pixels */
export function centeredSquare(fraction) {
  const side = Math.round(SIZE * Math.sqrt(fraction)), start = (SIZE - side) >> 1;
  return (x, y) => x >= start && x < start + side && y >= start && y < start + side;
}
// 44 px, 2.95% of the image but 5.88% of the analyzed ellipse (half the frame): mid-band between NOISE_FLOOR 0.01 and WIDESPREAD 0.10
export const inSpot = centeredSquare(0.03);

/** Writes an opaque SIZE x SIZE PNG to a file URL; fill(x, y) returns integer [r, g, b] in 0..255 */
export function writePng(url, fill) {
  const png = new PNG({ width: SIZE, height: SIZE });
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) png.data.set([...fill(x, y), 255], 4 * (y * SIZE + x));
  mkdirSync(new URL('.', url), { recursive: true });
  writeFileSync(url, PNG.sync.write(png));
}
