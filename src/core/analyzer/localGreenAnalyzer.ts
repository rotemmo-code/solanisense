import { rgbToLab, type Lab } from './color';
import { THRESHOLDS as T } from './thresholds';
import type { AnalysisResult, Analyzer, Frame, Lighting } from './types';

const median = (v: number[]) => {
  const s = Float64Array.from(v).sort(), m = s.length >> 1; // typed-array sort is numeric
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export class LocalGreenAnalyzer implements Analyzer {
  analyze({ width, height, data }: Frame): AnalysisResult {
    const mask = new Uint8Array(width * height);
    // a buffer of the wrong length would misread every pixel; 'dark' freezes the verdict instead of a silent 'none'
    if (data.length !== 4 * width * height) return { greenRatio: 0, mask, lighting: 'dark' };
    // shortcut: no background segmentation, assumes potato fills the frame; upgrade when real-image calibration shows background false positives
    const rx = (T.ROI_FRACTION * width) / 2, ry = (T.ROI_FRACTION * height) / 2;
    const roi: number[] = [], lab: Lab[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = (x + 0.5 - width / 2) / rx, dy = (y + 0.5 - height / 2) / ry; // pixel center, in ellipse units
        if (dx * dx + dy * dy > 1) continue;
        const i = y * width + x;
        roi.push(i);
        lab.push(rgbToLab(data[4 * i], data[4 * i + 1], data[4 * i + 2]));
      }
    }
    if (roi.length === 0) return { greenRatio: 0, mask, lighting: 'dark' }; // empty frame: nothing to judge, and 'dark' keeps the verdict frozen
    const [medianL, medianA, medianB] = [0, 1, 2].map((k) => median(lab.map((p) => p[k])));
    // regime 2: the median itself is chlorophyll yellow-green, so most of the ROI is greening; any other median is skin-like (regime 1)
    const clearlyGreen = medianA < T.GREEN_MEDIAN_A && medianB > 0;
    // b* is skipped when the median is clearly green: a yellow-green tuber has a high b*, and calling that tinted light would freeze its verdict
    const lighting: Lighting = medianL < T.DARK_L ? 'dark' : medianA > T.TINT_A || (!clearlyGreen && Math.abs(medianB) > T.TINT_B) ? 'tinted' : 'ok';
    let green = 0;
    lab.forEach(([L, a], k) => {
      // regime 1 has no absolute gate: a warm cast lifts faint green above A_ABS, but it lifts the median with it
      if (L > T.L_MIN && (clearlyGreen ? a < T.A_ABS : a < medianA - T.A_REL)) { mask[roi[k]] = 1; green++; }
    });
    return { greenRatio: green / roi.length, mask, lighting };
  }
}
