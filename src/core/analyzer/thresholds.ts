// Detection thresholds, spec section 4. Engineering starting values, not medically validated; calibrate on the lighting matrix.
export const THRESHOLDS = {
  GREEN_MEDIAN_A: -10, // ROI median a* below this with median b* above 0 is chlorophyll yellow-green (regime 2); any other median is skin-like (regime 1)
  A_REL: 11, // regime 1: green pixel when a* is more than this below the median; relative only, because a color cast moves the median with every pixel
  A_ABS: -4, // regime 2: green pixel when a* is below this; the whole surface may be greening, so nothing relative is left to find
  L_MIN: 20, // both regimes: and L* above this
  NOISE_FLOOR: 0.01, // green ratio below this is noise: verdict none
  WIDESPREAD: 0.10, // green ratio where the verdict becomes widespread
  DARK_L: 25, // median L* below this: lighting dark
  TINT_B: 60, // |median b*| above this: lighting tinted, unless the median is clearly green (regime 2); high on purpose, yellow skin reaches b* 45
  TINT_A: 45, // median a* above this: lighting tinted; high on purpose, red skin reaches a* 35
  ROI_FRACTION: 0.8, // ROI ellipse semi-axes as a fraction of half the frame width and height
  MIN_OK_FRAMES_FOR_NONE: 10, // a live scan shows 'none' only after this many well-lit frames, about 3 s at 300 ms; one frame sees one side
} as const;
