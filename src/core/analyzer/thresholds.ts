// Detection thresholds, spec section 4. Engineering starting values, not medically validated; calibrate on the lighting matrix.
export const THRESHOLDS = {
  A_ABS: -4, // green pixel: a* below this,
  A_REL: 6, // and more than this below the frame's median a*,
  L_MIN: 20, // and L* above this
  NOISE_FLOOR: 0.01, // green ratio below this is noise: verdict none
  WIDESPREAD: 0.10, // green ratio where the verdict becomes widespread
  DARK_L: 25, // median L* below this: lighting dark
  TINT_B: 60, // |median b*| above this: lighting tinted, unless the median a* is already green (below A_ABS); high on purpose, yellow skin reaches b* 45
  TINT_A: 45, // median a* above this: lighting tinted; high on purpose, red skin reaches a* 35
  ROI_FRACTION: 0.8, // ROI ellipse semi-axes as a fraction of half the frame width and height
} as const;
