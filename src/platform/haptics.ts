import type { Verdict } from '../core/analyzer/types';

export const VIBRATION: Record<Verdict, number[]> = { none: [], local: [200], widespread: [200, 100, 200, 100, 200] };
export interface Haptics { vibrate(v: Verdict): void }

export class WebHaptics implements Haptics {
  vibrate(v: Verdict): void {
    // an empty pattern would cancel a running vibration; iOS Safari has no vibrate at all
    if (VIBRATION[v].length > 0 && typeof navigator.vibrate === 'function') navigator.vibrate(VIBRATION[v]);
  }
}
