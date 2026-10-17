import type { Lighting, Verdict } from '../../core/analyzer/types';
import { LIGHTING_TEXT, VERDICT_TEXT } from '../strings';

// the shape carries the level without color: a check in a circle, a triangle, an X (spec 4.3)
const SHAPE: Record<Verdict, { name: string; d: string }> = {
  none: { name: 'check', d: 'M24 3a21 21 0 1 0 0 42 21 21 0 1 0 0-42M14 24l7 7 13-14' },
  local: { name: 'triangle', d: 'M24 5 45 42H3Z' },
  widespread: { name: 'x', d: 'M9 9l30 30M39 9 9 39' },
};

/** verdict null: nothing judged yet. The live region still renders, so screen readers announce the first verdict when it arrives. */
export function VerdictBanner({ verdict, lighting }: { verdict: Verdict | null; lighting: Lighting }) {
  return (
    <div aria-live="assertive">
      {verdict && (
        <p className="flex items-center gap-3 text-[40px] leading-tight font-bold">
          <svg data-shape={SHAPE[verdict].name} aria-hidden="true" viewBox="0 0 48 48" className="size-12 shrink-0" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <path d={SHAPE[verdict].d} />
          </svg>
          {VERDICT_TEXT[verdict].title}
        </p>
      )}
      {lighting !== 'ok' && <p className="mt-1 text-2xl">{LIGHTING_TEXT[lighting]}</p>}
    </div>
  );
}
