import { ScanState, verdictFor } from './verdict';

test('verdictFor', () => { expect(verdictFor(0)).toBe('none'); expect(verdictFor(0.0099)).toBe('none'); expect(verdictFor(0.01)).toBe('local'); expect(verdictFor(0.0999)).toBe('local'); expect(verdictFor(0.1)).toBe('widespread'); });
test('update שומר את החמור ביותר ומחזיר true רק בעלייה', () => {
  const s = new ScanState(); const f = { width: 1, height: 1, data: new Uint8ClampedArray(4) };
  expect(s.update({ greenRatio: 0.05, mask: new Uint8Array(1), lighting: 'ok' }, f)).toBe(true);
  expect(s.update({ greenRatio: 0.02, mask: new Uint8Array(1), lighting: 'ok' }, f)).toBe(false);
  expect(s.snapshot.worstRatio).toBe(0.05);
  expect(s.update({ greenRatio: 0.5, mask: new Uint8Array(1), lighting: 'ok' }, f)).toBe(true);
  expect(s.snapshot.worst).toBe('widespread');
});
test('תאורה לא תקינה לא מעדכנת', () => { const s = new ScanState(); expect(s.update({ greenRatio: 0.5, mask: new Uint8Array(1), lighting: 'dark' }, { width: 1, height: 1, data: new Uint8ClampedArray(4) })).toBe(false); expect(s.snapshot.worst).toBe('none'); });
test('reset', () => { const s = new ScanState(); s.update({ greenRatio: 0.5, mask: new Uint8Array(1), lighting: 'ok' }, { width: 1, height: 1, data: new Uint8ClampedArray(4) }); s.reset(); expect(s.snapshot.worst).toBe('none'); expect(s.snapshot.worstFrame).toBeNull(); });

// Added: the same-level rule of the brief's step 3, tinted lighting, the first clean frame, and snapshots handed to the UI
const frame = () => ({ width: 1, height: 1, data: new Uint8ClampedArray(4) });
const ok = (greenRatio: number, mask = new Uint8Array(1)) => ({ greenRatio, mask, lighting: 'ok' as const });
test('אותה רמה ויחס גבוה יותר: שומר את הפריים הגרוע ביותר ומחזיר false', () => {
  const s = new ScanState(); const f = frame(), m = new Uint8Array(1);
  expect(s.update(ok(0.02), frame())).toBe(true);
  expect(s.update(ok(0.05, m), f)).toBe(false);
  expect(s.snapshot.worst).toBe('local'); expect(s.snapshot.worstRatio).toBe(0.05); expect(s.snapshot.worstFrame).toBe(f); expect(s.snapshot.worstMask).toBe(m);
});
test('תאורה צבעונית לא מעדכנת', () => { const s = new ScanState(); expect(s.update({ ...ok(0.5), lighting: 'tinted' }, frame())).toBe(false); expect(s.snapshot.worstFrame).toBeNull(); });
test('הפריים התקין הראשון נשמר גם בלי ירוק, בלי התראה', () => { const s = new ScanState(); const f = frame(); expect(s.update(ok(0), f)).toBe(false); expect(s.snapshot.worstFrame).toBe(f); expect(s.snapshot.worst).toBe('none'); });
test('snapshot שכבר נמסר לא משתנה אחרי update או reset', () => {
  const s = new ScanState(); s.update(ok(0.05), frame()); const first = s.snapshot;
  s.update(ok(0.5), frame()); const second = s.snapshot; s.reset();
  expect(first.worst).toBe('local'); expect(first.worstRatio).toBe(0.05); expect(second.worst).toBe('widespread');
});
