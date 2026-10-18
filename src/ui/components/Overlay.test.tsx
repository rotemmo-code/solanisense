import { render } from '@testing-library/react';
import { THRESHOLDS } from '../../core/analyzer/thresholds';
import { Overlay } from './Overlay';
import * as drawing from './Overlay.drawing';

afterEach(() => { vi.restoreAllMocks(); });

const box = () => {
  const ctx = { translate: vi.fn() };
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never);
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(320); // not 300 or 150, a canvas's default size
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(100);
  return { ctx, getContext, draw: vi.spyOn(drawing, 'drawOverlay').mockImplementation(() => {}), guide: vi.spyOn(drawing, 'drawRoiGuide').mockImplementation(() => {}) };
};

// Added (the brief has no Overlay test): the canvas takes the video box, and the marks land on the picture the video letterboxes inside it.
// Fix wave: the ROI guide is drawn on every repaint, on the same picture, and stays there while bad light turns the marks off.
test('canvas בגודל תיבת הווידאו, הסימון והמסגרת על התמונה הממורכזת, ובלי סימון רק המסגרת', () => {
  const { ctx, getContext, draw, guide } = box();
  const mask = new Uint8Array(200);
  const { container, rerender } = render(<Overlay marks={{ mask, width: 20, height: 10 }} />);
  const canvas = container.querySelector('canvas')!;
  expect(canvas).toHaveAttribute('aria-hidden', 'true');
  expect([canvas.width, canvas.height]).toEqual([320, 100]);
  // scale min(320/20, 100/10) = 10: the 200x100 picture sits 60px in from each side
  expect(ctx.translate).toHaveBeenCalledWith(60, 0);
  expect(draw).toHaveBeenCalledWith(ctx, mask, 20, 10, 10, 10);
  expect(guide).toHaveBeenCalledWith(ctx, 200, 100, THRESHOLDS.ROI_FRACTION);
  expect(guide.mock.invocationCallOrder[0]).toBeLessThan(draw.mock.invocationCallOrder[0]); // the marks go over the guide
  rerender(<Overlay marks={null} />);
  expect(draw).toHaveBeenCalledTimes(1); expect(getContext).toHaveBeenCalledTimes(2);
  expect(guide).toHaveBeenCalledTimes(2); expect(guide).toHaveBeenLastCalledWith(ctx, 200, 100, THRESHOLDS.ROI_FRACTION); expect(ctx.translate).toHaveBeenLastCalledWith(60, 0);
});
test('לפני הפריים הראשון: המסגרת על כל התיבה, כי צורת התמונה עוד לא ידועה', () => {
  const { ctx, draw, guide } = box();
  render(<Overlay marks={null} />);
  expect(guide).toHaveBeenCalledExactlyOnceWith(ctx, 320, 100, THRESHOLDS.ROI_FRACTION);
  expect(ctx.translate).not.toHaveBeenCalled(); expect(draw).not.toHaveBeenCalled();
});
