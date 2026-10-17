import { useEffect, useRef } from 'react';
import type { ScanSnapshot } from '../../core/verdict';
import { Icon } from '../components/Icon';
import { drawOverlay } from '../components/Overlay.drawing';
import { VerdictBanner } from '../components/VerdictBanner';
import { CULTIVAR_WARNING, NOTHING_ANALYZED, RESULT_TEXT, VERDICT_TEXT } from '../strings';
import { CARD, PRIMARY_BUTTON } from '../styles';

export function ResultScreen({ snapshot, onAgain }: { snapshot: ScanSnapshot; onAgain: () => void }) {
  const { worst, worstFrame: frame, worstMask: mask } = snapshot;
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = frame && ref.current!.getContext('2d');
    if (!frame || !ctx) return;
    // shortcut: drawn at frame resolution and stretched by CSS, so the stripes look soft on big or high-DPI screens; upgrade by drawing at display size times devicePixelRatio if they look blurry
    ctx.putImageData(new ImageData(frame.data, frame.width, frame.height), 0, 0);
    if (mask) drawOverlay(ctx, mask, frame.width, frame.height, 1, 1);
  }, [frame, mask]);

  // below the noise floor the share is noise, and "1%" beside "no green detected" would contradict the verdict
  const percent = worst === 'none' ? null : `${Math.round(snapshot.worstRatio * 100)}%`;
  const label = `${RESULT_TEXT.image}: ${VERDICT_TEXT[worst].title}${percent ? `, ${percent} ${RESULT_TEXT.percent}` : ''}`;

  return (
    <div className="flex flex-col gap-4 p-4">
      {frame ? (
        <>
          <div className={CARD}><VerdictBanner verdict={worst} lighting="ok" /></div>
          <canvas ref={ref} width={frame.width} height={frame.height} role="img" aria-label={label} className="max-h-[50dvh] w-full rounded-card object-contain" />
          <div className={`${CARD} space-y-3`}>
            {percent && <p className="text-2xl"><span className="font-bold">{percent}</span> {RESULT_TEXT.percent}</p>}
            <p className="text-2xl">{VERDICT_TEXT[worst].advice}</p>
          </div>
        </>
      ) : (
        <p className={`${CARD} text-2xl font-bold`}>{NOTHING_ANALYZED}</p>
      )}
      <p className="text-xl">{CULTIVAR_WARNING}</p>
      <button type="button" onClick={onAgain} className={PRIMARY_BUTTON}><Icon name="camera" />{RESULT_TEXT.again}</button>
    </div>
  );
}
