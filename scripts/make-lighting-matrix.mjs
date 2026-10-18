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
const FAINT = [165, 160, 105], YELLOW = [215, 185, 120]; // faint greening (daylight a* -6.70) and a clean yellow skin (daylight a* 2.10, b* 36.89)
const KINDS = {
  'potato-clean': () => BROWN,
  'potato-green-spot': (x, y) => (inSpot(x, y) ? GREEN : BROWN),
  'potato-faint-spot': (x, y) => (inSpot(x, y) ? FAINT : BROWN),
  'potato-yellow-clean': () => YELLOW,
};
// seeded Gaussian, sd 6 per channel (mulberry32, then Box-Muller), so every run writes the same noisy skin
let seed = 1;
const uniform = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const NOISE = Array.from({ length: SIZE * SIZE * 3 }, () => 6 * Math.sqrt(-2 * Math.log(1 - uniform())) * Math.cos(2 * Math.PI * uniform()));

const dir = new URL('../test-images/synthetic/', import.meta.url);
const write = (light, kind, color) => writePng(new URL(`${light}-${kind}.png`, dir), (x, y) => color(x, y).map((v, i) => Math.min(255, Math.max(0, Math.round(v * LIGHTS[light](x)[i])))));
for (const light of Object.keys(LIGHTS)) for (const [kind, color] of Object.entries(KINDS)) write(light, kind, color);
// the same skin under daylight and the two casts that pull a clean median toward green
for (const light of ['daylight', 'cool-6500k', 'fluorescent']) write(light, 'potato-noisy-clean', (x, y) => BROWN.map((v, c) => v + NOISE[3 * (y * SIZE + x) + c]));
// daylight only: one row that reaches widespread; the spot rows already cover the lights
const inWide = centeredSquare(0.4); // 162 px, 40% of the image
writePng(new URL('daylight-potato-green-wide.png', dir), (x, y) => (inWide(x, y) ? GREEN : BROWN));
