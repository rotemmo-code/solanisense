import { THRESHOLDS } from './thresholds';
test('ספים נעולים (שינוי מכוון דורש עדכון snapshot)', () => { expect(THRESHOLDS).toMatchInlineSnapshot(`
  {
    "A_ABS": -4,
    "A_REL": 11,
    "DARK_L": 25,
    "GREEN_MEDIAN_A": -10,
    "L_MIN": 20,
    "MIN_OK_FRAMES_FOR_NONE": 10,
    "NOISE_FLOOR": 0.01,
    "ROI_FRACTION": 0.8,
    "TINT_A": 45,
    "TINT_B": 60,
    "WIDESPREAD": 0.1,
  }
`); });
