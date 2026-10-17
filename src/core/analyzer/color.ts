// sRGB 0..255 to CIELAB under D65, L in 0..100
export type Lab = [L: number, a: number, b: number];

const toLinear = (v: number) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const D = 6 / 29;
// CIE f(t): cube root, with a linear segment near zero so that black maps to L = 0
const f = (t: number) => (t > D ** 3 ? Math.cbrt(t) : t / (3 * D * D) + 4 / 29);

export function rgbToLab(r: number, g: number, b: number): Lab {
  const R = toLinear(r), G = toLinear(g), B = toLinear(b);
  // sRGB to XYZ (D65 matrix), each axis divided by the D65 white point (0.95047, 1.0, 1.08883)
  const fx = f((0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047);
  const fy = f(0.2126729 * R + 0.7151522 * G + 0.0721750 * B);
  const fz = f((0.0193339 * R + 0.1191920 * G + 0.9503041 * B) / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
