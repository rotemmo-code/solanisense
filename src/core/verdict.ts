import { THRESHOLDS as T } from './analyzer/thresholds';
import type { AnalysisResult, Frame, Verdict } from './analyzer/types';

export function verdictFor(greenRatio: number): Verdict {
  return greenRatio >= T.WIDESPREAD ? 'widespread' : greenRatio >= T.NOISE_FLOOR ? 'local' : 'none';
}

export const SEVERITY: Record<Verdict, number> = { none: 0, local: 1, widespread: 2 };

export interface ScanSnapshot { worst: Verdict; worstRatio: number; worstFrame: Frame | null; worstMask: Uint8Array | null }

const empty = (): ScanSnapshot => ({ worst: 'none', worstRatio: 0, worstFrame: null, worstMask: null });

export class ScanState {
  #snapshot = empty();
  // replaced, never mutated, so a snapshot already handed to the UI stays as it was
  get snapshot(): ScanSnapshot { return this.#snapshot; }

  /** Returns true when the severity rose (the UI then speaks and vibrates) */
  update(result: AnalysisResult, frame: Frame): boolean {
    const prev = this.#snapshot;
    // the first well-lit frame is kept even without green, so a clean tuber still has an image on the result screen
    if (result.lighting !== 'ok' || (prev.worstFrame !== null && result.greenRatio <= prev.worstRatio)) return false;
    const worst = verdictFor(result.greenRatio);
    this.#snapshot = { worst, worstRatio: result.greenRatio, worstFrame: frame, worstMask: result.mask };
    return SEVERITY[worst] > SEVERITY[prev.worst];
  }

  reset(): void { this.#snapshot = empty(); }
}
