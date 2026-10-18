import { useEffect, useRef } from 'react';
import { THRESHOLDS as T } from '../../core/analyzer/thresholds';
import type { ScanSnapshot } from '../../core/verdict';
import { platform } from '../../platform';
import type { Settings } from '../../platform/storage';
import { drawOverlay } from '../components/Overlay.drawing';
import { VerdictBanner } from '../components/VerdictBanner';
import { CULTIVAR_WARNING, NOTHING_ANALYZED, RESULT_TEXT, TOO_FEW_FRAMES, VERDICT_TEXT } from '../strings';

export function ResultScreen({ snapshot, source, settings, onAgain }: { snapshot: ScanSnapshot; source: 'live' | 'upload'; settings: Settings; onAgain: () => void }) {
  const { worst, worstFrame: frame, worstMask: mask } = snapshot;
  // no verdict without a well-lit frame; a live 'none' also needs a few seconds of them, while an upload is one deliberate image
  const neutral = !frame ? NOTHING_ANALYZED : worst === 'none' && source === 'live' && snapshot.okFrames < T.MIN_OK_FRAMES_FOR_NONE ? TOO_FEW_FRAMES : null;
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext('2d'); // no canvas while a neutral message stands in for the verdict
    if (!frame || !ctx) return;
    // shortcut: drawn at frame resolution and stretched by CSS, so the stripes look soft on big or high-DPI screens; upgrade by drawing at display size times devicePixelRatio if they look blurry
    ctx.putImageData(new ImageData(frame.data, frame.width, frame.height), 0, 0);
    if (mask) drawOverlay(ctx, mask, frame.width, frame.height, 1, 1);
  }, [frame, mask]);

  // once, when the result appears (App mounts a new screen for each result): a verdict is spoken and felt, a neutral message is not
  useEffect(() => {
    if (neutral) return;
    if (settings.speech) platform.speech.speak(VERDICT_TEXT[worst].speech);
    if (settings.haptics) platform.haptics.vibrate(worst); // 'none' has an empty pattern, which the platform skips
  }, []);

  // below the noise floor the share is noise, and "1%" beside "no green detected" would contradict the verdict
  const percent = worst === 'none' ? null : `${Math.round(snapshot.worstRatio * 100)}%`;
  const label = `${RESULT_TEXT.image}: ${VERDICT_TEXT[worst].title}${percent ? `, ${percent} ${RESULT_TEXT.percent}` : ''}`;

  return (
    <div className="flex flex-col gap-4 p-4">
      {!neutral && frame ? (
        <>
          <VerdictBanner verdict={worst} lighting="ok" />
          <canvas ref={ref} width={frame.width} height={frame.height} role="img" aria-label={label} className="max-h-[50dvh] w-full object-contain" />
          {percent && <p className="text-2xl"><span className="font-bold">{percent}</span> {RESULT_TEXT.percent}</p>}
          <p className="text-2xl">{VERDICT_TEXT[worst].advice}</p>
        </>
      ) : (
        <p className="text-2xl font-bold">{neutral}</p>
      )}
      <p className="text-xl">{CULTIVAR_WARNING}</p>
      <button type="button" onClick={onAgain} className="flex min-h-14 w-full items-center justify-center rounded-xl bg-white px-6 text-2xl font-bold text-black">{RESULT_TEXT.again}</button>
    </div>
  );
}
