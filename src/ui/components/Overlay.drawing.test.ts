import { drawOverlay, outlineOf } from './Overlay.drawing';

test('outline: ריבוע 4x4 בתוך 8x8 נותן 12 פיקסלי מתאר', () => { const m = new Uint8Array(64); for (let y = 2; y < 6; y++) for (let x = 2; x < 6; x++) m[y * 8 + x] = 1; const o = outlineOf(m, 8, 8); expect(Array.from(o).reduce((a, b) => a + b, 0)).toBe(12); });
test('outline של mask ריק ריק', () => { expect(Array.from(outlineOf(new Uint8Array(16), 4, 4)).every(v => v === 0)).toBe(true); });

// Added: which pixels form the outline, and what drawOverlay paints, against a recording fake 2D context
test('outline: רק הטבעת של הריבוע, 4 שכנים ולא 8, ושפת הפריים נחשבת לא ירוקה', () => {
  const m = new Uint8Array(64); for (let y = 2; y < 6; y++) for (let x = 2; x < 6; x++) m[y * 8 + x] = 1;
  const o = outlineOf(m, 8, 8);
  expect([o[2 * 8 + 2], o[5 * 8 + 3], o[3 * 8 + 3], o[4 * 8 + 4], o[0]]).toEqual([1, 1, 0, 0, 0]);
  expect(outlineOf(Uint8Array.of(0, 1, 1, 1, 1, 1, 1, 1, 1), 3, 3)[4]).toBe(0); // the center misses only a diagonal neighbor
  expect(Array.from(outlineOf(new Uint8Array(4).fill(1), 2, 2))).toEqual([1, 1, 1, 1]);
});

const recorder = () => {
  const log: string[] = [], moves: number[][] = [];
  const ctx = {
    strokeStyle: '', fillStyle: '', lineWidth: 0,
    save: () => log.push('save'), restore: () => log.push('restore'), beginPath: () => log.push('beginPath'), clip: () => log.push('clip'),
    rect: (...a: number[]) => log.push(`rect ${a.join(' ')}`), moveTo: (...a: number[]) => moves.push(a), lineTo: () => {},
    stroke() { log.push(`stroke ${this.strokeStyle} ${this.lineWidth}`); }, fill() { log.push(`fill ${this.fillStyle}`); },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, log, moves };
};
test('drawOverlay: mask ריק לא מצייר; אחרת פסים בתוך ה-mask וקו מתאר, שחור מתחת ללבן, בקנה המידה', () => {
  const { ctx, log, moves } = recorder();
  drawOverlay(ctx, new Uint8Array(4), 2, 2, 10, 2);
  expect(log).toEqual([]);
  drawOverlay(ctx, Uint8Array.of(1, 1, 0, 1), 2, 2, 10, 2);
  expect(log).toEqual([
    // stripes: clipped to the green runs of each row, black first and wider, then white; the clip ends with restore
    'save', 'beginPath', 'rect 0 0 20 2', 'rect 10 2 10 2', 'clip', 'beginPath', 'stroke black 3', 'stroke white 1.5', 'restore',
    // outline: a box of at least 3px on every outline pixel, a black edge stroked under the white fill
    'beginPath', 'rect 0 -0.5 10 3', 'rect 10 -0.5 10 3', 'rect 10 1.5 10 3', 'stroke black 2', 'fill white',
  ]);
  expect(moves[1][0] - moves[0][0]).toBeCloseTo(6 * Math.SQRT2); // 45° stripes 6px apart, measured across them
});
