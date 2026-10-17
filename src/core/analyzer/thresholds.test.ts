import { THRESHOLDS } from './thresholds';
test('ספים נעולים (שינוי מכוון דורש עדכון snapshot)', () => { expect(THRESHOLDS).toMatchInlineSnapshot(`
  {
    "A_ABS": -4,
    "A_REL": 6,
    "DARK_L": 25,
    "L_MIN": 20,
    "NOISE_FLOOR": 0.01,
    "ROI_FRACTION": 0.8,
    "TINT_A": 45,
    "TINT_B": 60,
    "WIDESPREAD": 0.1,
  }
`); });
