import { useEffect, useRef } from 'react';
import { drawOverlay } from './Overlay.drawing';

export interface Marks { mask: Uint8Array; width: number; height: number }

/** Green marks over the live video. The canvas covers the whole video box; the video letterboxes its picture inside that box (object-contain). */
export function Overlay({ marks }: { marks: Marks | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    // shortcut: the canvas works in CSS pixels, so the marks look soft on high-DPI screens; upgrade by scaling by devicePixelRatio if they look blurry
    canvas.width = canvas.clientWidth; // resizing also clears the previous marks
    canvas.height = canvas.clientHeight;
    const ctx = marks ? canvas.getContext('2d') : null;
    if (!marks || !ctx) return;
    const scale = Math.min(canvas.width / marks.width, canvas.height / marks.height);
    ctx.translate((canvas.width - marks.width * scale) / 2, (canvas.height - marks.height * scale) / 2);
    drawOverlay(ctx, marks.mask, marks.width, marks.height, scale, scale);
  }, [marks]);
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />;
}
