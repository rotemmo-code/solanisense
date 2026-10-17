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
  ['אדמדמה (רק a* מעל TINT_A)', [200, 130, 140]], // L* 61.8, a* 28.3, b* 5.9
  ['כחולה (b* שלילי, נתפס בערך המוחלט)', [100, 140, 230]], // L* 59.1, a* 12.4, b* -49.8
])('תאורה %s: tinted', (_, rgb) => { expect(a.analyze(makeFrame(16, 16, () => rgb)).lighting).toBe('tinted'); });
