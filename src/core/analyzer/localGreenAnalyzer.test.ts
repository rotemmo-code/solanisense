import { LocalGreenAnalyzer } from './localGreenAnalyzer';
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
  const PALE: RGB = [160, 155, 130]; // a* -2.5, above A_ABS, so the relative rule decides
  expect(a.analyze(spot([150, 152, 125], PALE)).greenRatio).toBe(0); // a* -5.55: below A_ABS but within A_REL of the median
  expect(a.analyze(spot([135, 152, 122], PALE)).greenRatio).toBeGreaterThan(0.01); // a* -11.79
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
