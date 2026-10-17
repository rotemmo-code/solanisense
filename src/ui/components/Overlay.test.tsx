import { render } from '@testing-library/react';
import { Overlay } from './Overlay';
import * as drawing from './Overlay.drawing';

afterEach(() => { vi.restoreAllMocks(); });

// Added (the brief has no Overlay test): the canvas takes the video box, and the marks land on the picture the video letterboxes inside it
test('canvas בגודל תיבת הווידאו, הסימון על התמונה הממורכזת, ובלי סימון רק ניקוי', () => {
  const ctx = { translate: vi.fn() };
  const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never);
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(320); // not 300 or 150, a canvas's default size
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(100);
  const draw = vi.spyOn(drawing, 'drawOverlay').mockImplementation(() => {});
  const mask = new Uint8Array(200);
  const { container, rerender } = render(<Overlay marks={{ mask, width: 20, height: 10 }} />);
  const canvas = container.querySelector('canvas')!;
  expect(canvas).toHaveAttribute('aria-hidden', 'true');
  expect([canvas.width, canvas.height]).toEqual([320, 100]);
  // scale min(320/20, 100/10) = 10: the 200x100 picture sits 60px in from each side
  expect(ctx.translate).toHaveBeenCalledWith(60, 0);
  expect(draw).toHaveBeenCalledWith(ctx, mask, 20, 10, 10, 10);
  rerender(<Overlay marks={null} />);
  expect(draw).toHaveBeenCalledTimes(1); expect(getContext).toHaveBeenCalledTimes(1);
});
