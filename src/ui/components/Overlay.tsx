import { useEffect, useRef } from 'react';
import { THRESHOLDS } from '../../core/analyzer/thresholds';
import { drawOverlay, drawRoiGuide } from './Overlay.drawing';

export interface Marks { mask: Uint8Array; width: number; height: number }

/** Green marks and the analyzed ellipse over the live video. The canvas covers the whole video box; the video letterboxes its picture inside that box (object-contain). */
export function Overlay({ marks }: { marks: Marks | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const picture = useRef<{ width: number; height: number } | null>(null); // the last frame's size, so the guide holds still while bad light turns the marks off
  useEffect(() => {
    const canvas = ref.current!;
    // shortcut: the canvas works in CSS pixels, so the marks look soft on high-DPI screens; upgrade by scaling by devicePixelRatio if they look blurry
    canvas.width = canvas.clientWidth; // resizing also clears the previous marks
    canvas.height = canvas.clientHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (marks) picture.current = marks;
    const p = picture.current;
    // before the first frame the picture's shape is unknown, so the guide frames the whole box
    if (!p) { drawRoiGuide(ctx, canvas.width, canvas.height, THRESHOLDS.ROI_FRACTION); return; }
    const scale = Math.min(canvas.width / p.width, canvas.height / p.height);
    ctx.translate((canvas.width - p.width * scale) / 2, (canvas.height - p.height * scale) / 2);
    drawRoiGuide(ctx, p.width * scale, p.height * scale, THRESHOLDS.ROI_FRACTION); // under the marks, which carry the verdict
    if (marks) drawOverlay(ctx, marks.mask, p.width, p.height, scale, scale);
  }, [marks]);
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />;
}
