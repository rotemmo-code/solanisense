/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decode as decodeJpeg, encode as encodeJpeg } from 'jpeg-js';
import { PNG } from 'pngjs';
import { verdictFor } from '../verdict';
import { rgbToLab } from './color';
import { LocalGreenAnalyzer } from './localGreenAnalyzer';
import { makeFrame } from './testFrames';
import { THRESHOLDS as T } from './thresholds';
import type { Frame } from './types';

// Every image under test-images/ against its line in expected.json: a verdict, or 'dark' / 'tinted' when the light must be rejected
const DIR = join(import.meta.dirname, '../../../test-images');
const expected: Record<string, string> = JSON.parse(readFileSync(join(DIR, 'expected.json'), 'utf8'));

const decode = (name: string, bytes: Buffer) => (/\.png$/i.test(name) ? PNG.sync.read(bytes) : decodeJpeg(bytes, { useTArray: true }));

// The app analyzes frames 256 wide (ScanScreen), so a photo is shrunk to that. EXIF rotation is ignored: the ROI ellipse turns with the image.
// shortcut: box average, the browser's drawImage filters differently; upgrade to decoding in Chromium if a real photo passes here but not in the app
function shrink(img: { width: number; height: number; data: ArrayLike<number> }): Frame {
  const scale = Math.min(1, 256 / img.width, 512 / img.height); // toFrame's limits; images are never enlarged here
  const width = Math.max(1, Math.round(img.width * scale)), height = Math.max(1, Math.round(img.height * scale));
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sum = [0, 0, 0]; let n = 0;
    for (let sy = Math.floor((y * img.height) / height); sy < Math.floor(((y + 1) * img.height) / height); sy++)
      for (let sx = Math.floor((x * img.width) / width); sx < Math.floor(((x + 1) * img.width) / width); sx++, n++)
        for (let c = 0; c < 3; c++) sum[c] += img.data[4 * (sy * img.width + sx) + c];
    data.set([...sum.map(v => v / n), 255], 4 * (y * width + x));
  }
  return { width, height, data };
}

// Diagnostics only, recomputed because AnalysisResult does not carry them: median L*, a*, b* of the ROI ellipse the analyzer judges
function medians({ width, height, data }: Frame): string {
  const rx = (T.ROI_FRACTION * width) / 2, ry = (T.ROI_FRACTION * height) / 2, lab: number[][] = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const dx = (x + 0.5 - width / 2) / rx, dy = (y + 0.5 - height / 2) / ry, i = 4 * (y * width + x);
    if (dx * dx + dy * dy <= 1) lab.push(rgbToLab(data[i], data[i + 1], data[i + 2]));
  }
  return [0, 1, 2].map(k => { const s = Float64Array.from(lab, p => p[k]).sort(), m = s.length >> 1; return (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2).toFixed(2); }).join(' / ');
}

test('לכל תמונה ב-test-images יש שורה ב-expected.json', () => {
  const images = readdirSync(DIR, { recursive: true, encoding: 'utf8' }).map(f => f.replaceAll('\\', '/')).filter(f => /\.(png|jpe?g)$/i.test(f));
  expect(images.filter(f => !(f in expected))).toEqual([]);
});
test.each(Object.entries(expected))('%s: מצופה %s', (file, want) => {
  const frame = shrink(decode(file, readFileSync(join(DIR, file))));
  const { greenRatio, lighting } = new LocalGreenAnalyzer().analyze(frame), verdict = verdictFor(greenRatio);
  // a verdict counts only in usable light: the app freezes the verdict while the light is dark or tinted
  expect(lighting === 'ok' ? verdict : lighting, `${file}: ratio ${greenRatio.toFixed(4)}, verdict ${verdict}, lighting ${lighting}, median L*/a*/b* ${medians(frame)}`).toBe(want);
});
// No real photo exists yet, so the photo path is checked on generated images: the shrink averages, and a JPEG decodes
test('תמונה גדולה מוקטנת ל-256 ברוחב בממוצע, ו-JPEG נקרא', () => {
  const f = shrink(makeFrame(1024, 768, (x, y) => (((x >> 1) + (y >> 1)) % 2 ? [200, 100, 0] : [0, 100, 200]))); // 2 px squares: every 4x4 block averages to [100, 100, 100]
  expect([f.width, f.height, ...new Set(f.data)]).toEqual([256, 192, 100, 255]);
  const j = decode('photo.jpg', encodeJpeg(makeFrame(64, 48, () => [190, 150, 100]), 95).data);
  expect([j.width, j.height]).toEqual([64, 48]);
  expect(Math.max(...Array.from(j.data, (v, i) => Math.abs(v - [190, 150, 100, 255][i % 4])))).toBeLessThanOrEqual(3);
});
