import { LocalGreenAnalyzer } from './localGreenAnalyzer';
import { THRESHOLDS as T } from './thresholds';
import { makeFrame } from './testFrames';

const BROWN: [number, number, number] = [190, 150, 100];
const GREEN: [number, number, number] = [110, 160, 70];
const a = new LocalGreenAnalyzer();
test('חום מלא: none', () => { const r = a.analyze(makeFrame(64, 64, () => BROWN)); expect(r.greenRatio).toBeLessThan(0.01); expect(r.lighting).toBe('ok'); });
test('ירוק מלא: widespread', () => { const r = a.analyze(makeFrame(64, 64, () => GREEN)); expect(r.greenRatio).toBeGreaterThan(0.10); });
test('כתם ירוק 10% בתוך ה-ROI: local', () => { const r = a.analyze(makeFrame(64, 64, (x, y) => (x >= 28 && x < 36 && y >= 20 && y < 44) ? GREEN : BROWN)); expect(r.greenRatio).toBeGreaterThan(0.01); expect(r.greenRatio).toBeLessThan(0.10); });
test('פיקסלים ירוקים מחוץ ל-ROI לא נספרים', () => { const r = a.analyze(makeFrame(64, 64, (x, y) => (x < 2 || y < 2) ? GREEN : BROWN)); expect(r.greenRatio).toBeLessThan(0.01); });
test('שחור: dark', () => { expect(a.analyze(makeFrame(16, 16, () => [5, 5, 5])).lighting).toBe('dark'); });
test('כתום רווי: tinted', () => { expect(a.analyze(makeFrame(16, 16, () => [255, 140, 0])).lighting).toBe('tinted'); });
test('לבן מלא: none, ok', () => { const r = a.analyze(makeFrame(16, 16, () => [250, 250, 250])); expect(r.greenRatio).toBe(0); expect(r.lighting).toBe('ok'); });
test('פיקסל אחד', () => { const r = a.analyze(makeFrame(1, 1, () => BROWN)); expect(r.mask.length).toBe(1); expect(Number.isFinite(r.greenRatio)).toBe(true); });
test('0x0 לא זורק', () => { const r = a.analyze({ width: 0, height: 0, data: new Uint8ClampedArray(0) }); expect(r.greenRatio).toBe(0); });
test('mask מסמן את הכתם', () => { const f = makeFrame(64, 64, (x, y) => (x >= 28 && x < 36 && y >= 20 && y < 44) ? GREEN : BROWN); const r = a.analyze(f); expect(r.mask[30 * 64 + 32]).toBe(1); expect(r.mask[30 * 64 + 5]).toBe(0); });

// Added: each case pins a rule the cases above leave open (ROI denominator, relative rule, L_MIN, ROI-only medians, non-square ellipse, the other two tint clauses)
type RGB = [number, number, number];
const spot = (inside: RGB, outside: RGB) => makeFrame(64, 64, (x, y) => (x >= 28 && x < 36 && y >= 20 && y < 44) ? inside : outside);
test('ירוק מלא: כל ה-ROI ירוק, היחס 1 (המכנה הוא ה-ROI ולא הפריים)', () => { expect(a.analyze(makeFrame(64, 64, () => GREEN)).greenRatio).toBe(1); });
test('קליפה כמעט ניטרלית: כתם ירקרק מעט לא נספר, כתם ירוק בבירור נספר', () => {
  const PALE: RGB = [160, 155, 130]; // a* -2.5, a skin-like median, so the relative rule decides
  expect(a.analyze(spot([150, 152, 125], PALE)).greenRatio).toBe(0); // a* -5.55: below A_ABS but within A_REL of the median
  // fix wave: was [135, 152, 122] (a* -11.79), 9.29 below the median, which only the old A_REL 6 counted
  expect(a.analyze(spot([120, 150, 115], PALE)).greenRatio).toBeGreaterThan(0.01); // a* -17.53, 15.03 below the median
});
test('ירוק כהה מתחת ל-L_MIN לא נספר', () => { expect(a.analyze(spot([20, 45, 10], BROWN)).greenRatio).toBe(0); }); // L* 15.7, a* -17.8
test('חציונים מה-ROI בלבד: רקע שחור סביב תפוח חום לא נחשב תאורה חלשה', () => { expect(a.analyze(makeFrame(64, 64, (x, y) => (x >= 14 && x < 50 && y >= 14 && y < 50) ? BROWN : [5, 5, 5])).lighting).toBe('ok'); });
test('פריים לא ריבועי: האליפסה נמתחת לרוחב וה-mask מסמן בדיוק את הכתם', () => {
  const r = a.analyze(makeFrame(64, 32, (x, y) => (x >= 50 && x < 56 && y >= 14 && y < 18) ? GREEN : BROWN));
  expect(r.mask.reduce((s, v) => s + v, 0)).toBe(24); expect(r.mask[15 * 64 + 52]).toBe(1);
});
test.each<[string, RGB]>([
  ['אדמדמה (רק a* מעל TINT_A)', [220, 40, 100]], // L* 49.1, a* 69.4, b* 11.9
  ['כחולה (b* שלילי, נתפס בערך המוחלט)', [60, 120, 255]], // L* 53.6, a* 27.1, b* -72.7
])('תאורה %s: tinted', (_, rgb) => { expect(a.analyze(makeFrame(16, 16, () => rgb)).lighting).toBe('tinted'); });
// Fix round 1: GREEN's b* is 41.06, so with the b* tint clause always on, a mostly green tuber read as tinted light and froze the verdict
test('פקעת ירוקה כולה או ברובה: התאורה ok ולא tinted', () => {
  const full = a.analyze(makeFrame(64, 64, () => GREEN)); expect(full.lighting).toBe('ok'); expect(full.greenRatio).toBeGreaterThan(0.10);
  expect(a.analyze(makeFrame(64, 64, (x, y) => ((x + y) % 5 < 3 ? GREEN : BROWN))).lighting).toBe('ok'); // 60.0% of the frame, 59.8% of the ROI
});
// Fix round 2: normal skins must not read as tinted light, and the lighting checks keep their order and the A_ABS boundary
test('קליפה צהובה: התאורה ok', () => { expect(a.analyze(makeFrame(64, 64, () => [210, 180, 110])).lighting).toBe('ok'); }); // b* 39.55
test('0x0: התאורה dark וה-mask ריק', () => { const r = a.analyze({ width: 0, height: 0, data: new Uint8ClampedArray(0) }); expect(r.lighting).toBe('dark'); expect(r.mask.length).toBe(0); });
test('כהה וגם צבעוני: dark נבדק קודם', () => { expect(a.analyze(makeFrame(16, 16, () => [0, 0, 150])).lighting).toBe('dark'); }); // L* 16.5, a* 53.3, b* -72.6: trips both checks
test('חציון a* מעט מעל A_ABS: הכלל היחסי עדיין חל', () => { expect(a.analyze(spot([145, 156, 145], [150, 156, 150])).greenRatio).toBe(0); }); // median a* -3.32; spot a* -6.08 is below A_ABS but within A_REL
test('חציון a* מעט מעל A_ABS: בדיקת b* עדיין חלה (אור זהוב)', () => { expect(a.analyze(makeFrame(16, 16, () => [255, 218, 0])).lighting).toBe('tinted'); }); // a* -3.44, b* 87.66
test('ירוק-צהבהב רווי (b* מעל TINT_B): עדיין ok כי החציון ירוק', () => { expect(a.analyze(makeFrame(64, 64, () => [160, 200, 50])).lighting).toBe('ok'); }); // a* -33.37, b* 65.70: keeps the median-green guard pinned now that GREEN's b* 41 is under TINT_B

// Fix wave (final review): the two-regime rule under color casts. Light multipliers as in scripts/make-lighting-matrix.mjs; makeFrame's clamped array rounds and clips.
const LIGHTS: Record<'daylight' | 'warm' | 'cool' | 'fluorescent', RGB> = { daylight: [1, 1, 1], warm: [1, 0.85, 0.6], cool: [0.8, 0.9, 1], fluorescent: [0.9, 1, 0.85] };
const lit = (rgb: RGB, light: RGB) => rgb.map((v, i) => v * light[i]) as RGB;
const FAINT: RGB = [165, 160, 105], YELLOW: RGB = [215, 185, 120], PALE_GREEN: RGB = [160, 165, 110]; // daylight a* -6.70, 2.10, -10.76
const inSpot = (x: number, y: number) => x >= 26 && x < 37 && y >= 26 && y < 37; // 11 px square, 3% of the 64x64 frame, 5.9% of the ROI
// seeded Gaussian (mulberry32, then Box-Muller), so the noisy skin is the same on every run
const gaussian = (seed: number) => {
  const next = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return () => Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next());
};
test.each(Object.keys(LIGHTS) as (keyof typeof LIGHTS)[])('כתם ירקרק חלש של 3% על חום, אור %s: local ו-ok', (light) => {
  const r = a.analyze(makeFrame(64, 64, (x, y) => lit(inSpot(x, y) ? FAINT : BROWN, LIGHTS[light]))); // warm lifts the spot to a* 2.30, above A_ABS, which the old gate dropped
  expect(r.lighting).toBe('ok'); expect(r.greenRatio).toBeGreaterThanOrEqual(T.NOISE_FLOOR); expect(r.greenRatio).toBeLessThan(T.WIDESPREAD);
});
test.each(['cool', 'fluorescent'] as const)('קליפה צהובה נקייה, אור %s: none ו-ok', (light) => {
  const r = a.analyze(makeFrame(64, 64, () => lit(YELLOW, LIGHTS[light]))); // median a* -5.70 and -8.27: the old fallback below A_ABS counted every pixel
  expect(r.lighting).toBe('ok'); expect(r.greenRatio).toBeLessThan(T.NOISE_FLOOR);
});
test.each(['daylight', 'cool', 'fluorescent'] as const)('קליפה חומה עם רעש גאוסי (סטיית תקן 6 לערוץ), אור %s: מתחת לרצפת הרעש', (light) => {
  const g = gaussian(1); // the same skin under each light
  const r = a.analyze(makeFrame(64, 64, () => lit(BROWN.map((v) => v + 6 * g()) as RGB, LIGHTS[light])));
  expect(r.lighting).toBe('ok'); expect(r.greenRatio).toBeLessThan(T.NOISE_FLOOR);
});
// Known false positive, pinned. The brief expected none, but a white surface under this cast has the median of a pale-green tuber (a* -14.84, b* 15.52),
// so it lands in regime 2 and every pixel counts. GREEN_MEDIAN_A below -15 would clear it, and a mostly pale-green side (a* -10.76) would then read none.
test('לבן באור פלורסנט: נספר כולו (חיובי שגוי ידוע, בכיוון הבטוח)', () => { const r = a.analyze(makeFrame(64, 64, () => lit([250, 250, 250], LIGHTS.fluorescent))); expect(r.lighting).toBe('ok'); expect(r.greenRatio).toBe(1); });
// Known false negative, pinned. The brief expected widespread. With exactly half the ROI pale green, the median sits midway (a* 7.82, between brown 17.55 and pale -1.90),
// so the pale half is 9.72 below it, inside A_REL, and regime 1 finds nothing; daylight and cool behave the same at exactly half. Below half the median stays on the skin.
test('חצי ירקרק בהיר על חום, אור חם: היחס 0 (שלילי שגוי ידוע); שליש מה-ROI: נרחבת', () => {
  const half = a.analyze(makeFrame(64, 64, (x) => lit(x < 32 ? PALE_GREEN : BROWN, LIGHTS.warm)));
  expect(half.lighting).toBe('ok'); expect(half.greenRatio).toBe(0);
  expect(a.analyze(makeFrame(64, 64, (x) => lit(x < 26 ? PALE_GREEN : BROWN, LIGHTS.warm))).greenRatio).toBeGreaterThanOrEqual(T.WIDESPREAD); // 35% of the ROI: the median is the skin's
});
test('טורקיז (a* ירוק אבל b* שלילי, לא כלורופיל): הכלל היחסי, לא נספר', () => { const r = a.analyze(makeFrame(64, 64, () => [90, 170, 170])); expect(r.lighting).toBe('ok'); expect(r.greenRatio).toBe(0); }); // a* -24.45, b* -7.60: the old fallback counted all of it
test('אור זהוב על חציון ירקרק מעט (a* בין GREEN_MEDIAN_A ל-A_ABS): בדיקת b* חלה, tinted', () => { expect(a.analyze(makeFrame(16, 16, () => [255, 225, 0])).lighting).toBe('tinted'); }); // a* -6.95, b* 88.92: the old gate skipped b* below A_ABS
test('אורך data שגוי: dark, יחס 0 ו-mask ריק, ולא "לא זוהה ירוק" שקט', () => {
  // light gray, so without the guard the frame would read ok and "no green"
  for (const length of [4 * 16 - 4, 4 * 16 + 4]) expect(a.analyze({ width: 4, height: 4, data: new Uint8ClampedArray(length).fill(200) })).toEqual({ greenRatio: 0, mask: new Uint8Array(16), lighting: 'dark' });
});
