import { rgbToLab } from './color';
const close = (x: number, y: number, tol = 1) => Math.abs(x - y) <= tol;
test('לבן', () => { const [L, a, b] = rgbToLab(255, 255, 255); expect(close(L, 100)).toBe(true); expect(close(a, 0)).toBe(true); expect(close(b, 0)).toBe(true); });
test('שחור', () => { const [L] = rgbToLab(0, 0, 0); expect(close(L, 0)).toBe(true); });
test('ירוק טהור a* שלילי חזק', () => { const [, a] = rgbToLab(0, 255, 0); expect(a).toBeLessThan(-70); });
test('אדום טהור a* חיובי', () => { const [, a] = rgbToLab(255, 0, 0); expect(a).toBeGreaterThan(70); });
test('חום תפוח אדמה a* חיובי קטן', () => { const [, a] = rgbToLab(190, 150, 100); expect(a).toBeGreaterThan(5); expect(a).toBeLessThan(20); });

// Published sRGB D65 values to ±0.05: the loose cases above never pin b*, the gamma curve or the dark linear segment
test.each([
  [255, 0, 0, 53.24, 80.09, 67.2],
  [0, 255, 0, 87.73, -86.18, 83.18],
  [0, 0, 255, 32.3, 79.19, -107.86],
  [128, 128, 128, 53.59, 0, 0],
  [1, 1, 1, 0.27, 0, 0],
])('ערכי ייחוס rgb(%i, %i, %i)', (r, g, b, L, a, bStar) => {
  expect(rgbToLab(r, g, b)).toEqual([expect.closeTo(L, 1), expect.closeTo(a, 1), expect.closeTo(bStar, 1)]);
});
