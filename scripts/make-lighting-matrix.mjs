// One-off: writes the synthetic lighting matrix to test-images/synthetic/<condition>-<kind>.png (committed). Run: node scripts/make-lighting-matrix.mjs
import { BROWN, GREEN, SIZE, centeredSquare, inSpot, writePng } from './synthetic.mjs';

// per-channel RGB multipliers: the color cast of each light, as a camera without white balance would record it
const WARM = [1.0, 0.85, 0.6], COOL = [0.8, 0.9, 1.0];
const LIGHTS = {
  daylight: () => [1, 1, 1],
  'warm-2700k': () => WARM,
  'cool-6500k': () => COOL,
  fluorescent: () => [0.9, 1.0, 0.85],
  dim: () => [0.3, 0.3, 0.3],
  mixed: x => (x < SIZE / 2 ? WARM : COOL), // left half warm, right half cool
};
const KINDS = { 'potato-clean': () => BROWN, 'potato-green-spot': (x, y) => (inSpot(x, y) ? GREEN : BROWN) };

const dir = new URL('../test-images/synthetic/', import.meta.url);
for (const [light, factor] of Object.entries(LIGHTS))
  for (const [kind, color] of Object.entries(KINDS))
    writePng(new URL(`${light}-${kind}.png`, dir), (x, y) => color(x, y).map((v, i) => Math.min(255, Math.max(0, Math.round(v * factor(x)[i])))));
// daylight only: one row that reaches widespread; the spot rows already cover the lights
const inWide = centeredSquare(0.4); // 162 px, 40% of the image
writePng(new URL('daylight-potato-green-wide.png', dir), (x, y) => (inWide(x, y) ? GREEN : BROWN));
