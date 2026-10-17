import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeFrame } from '../../core/analyzer/testFrames';
import type { Frame } from '../../core/analyzer/types';
import { platform } from '../../platform';
import * as cameraModule from '../../platform/camera';
import { DEFAULT_SETTINGS, type Settings } from '../../platform/storage';
import { VERDICT_TEXT } from '../strings';
import { ScanScreen } from './ScanScreen';

let frame: Frame | null = null;
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); frame = null; delete (navigator as any).mediaDevices; delete (document as any).visibilityState; });

test('בלי מצלמה: הסבר וכפתור העלאה', async () => { Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: () => Promise.reject(new Error('denied')) }, configurable: true }); render(<ScanScreen settings={DEFAULT_SETTINGS} onDone={() => {}} />); await userEvent.click(screen.getByRole('button', { name: 'התחל סריקה' })); expect(await screen.findByText(/אין גישה למצלמה/)).toBeInTheDocument(); expect(screen.getByLabelText('העלה תמונה')).toBeInTheDocument(); });
test('קובץ לא נתמך: הודעה', async () => { vi.spyOn(cameraModule, 'frameFromFile').mockRejectedValue(new Error('unsupported')); render(<ScanScreen settings={DEFAULT_SETTINGS} onDone={() => {}} />); await userEvent.upload(screen.getByLabelText('העלה תמונה'), new File(['x'], 'a.heic', { type: 'image/heic' })); expect(await screen.findByText('הקובץ לא נתמך')).toBeInTheDocument(); });

// Added: the start tap, the 300 ms loop, alerts on a rise only, the lighting gate, pausing in a hidden tab, cancelled starts, done and upload.
// The camera is faked on the platform object. Only setInterval is faked, so user-event and React keep their real timers.
type RGB = [number, number, number];
const BROWN: RGB = [190, 150, 100], GREEN: RGB = [110, 160, 70];
const withSquare = (lo: number, hi: number, around: RGB = BROWN) => makeFrame(20, 20, (x, y) => (x >= lo && x < hi && y >= lo && y < hi ? GREEN : around));
const clean = withSquare(0, 0), local = withSquare(9, 12), widespread = withSquare(7, 14); // 0%, 4% and 24% of the analyzed ellipse is green
const dark = makeFrame(20, 20, () => [10, 10, 10]), tinted = withSquare(7, 14, [255, 100, 0]); // orange light over 24% green

const fakeCamera = () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  return {
    paint: vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null), // the overlay asks for a context only when it has marks; jsdom has none, Overlay.test covers the drawing
    start: vi.spyOn(platform.camera, 'start').mockResolvedValue(),
    stop: vi.spyOn(platform.camera, 'stop').mockImplementation(() => {}),
    grab: vi.spyOn(platform.camera, 'grabFrame').mockImplementation(() => frame),
  };
};
const alerts = () => ({ speak: vi.spyOn(platform.speech, 'speak').mockImplementation(() => {}), vibrate: vi.spyOn(platform.haptics, 'vibrate').mockImplementation(() => {}) });
const renderScan = (settings: Settings = DEFAULT_SETTINGS) => { const onDone = vi.fn(); return { onDone, ...render(<ScanScreen settings={settings} onDone={onDone} />) }; };
const startTap = () => userEvent.click(screen.getByRole('button', { name: 'התחל סריקה' }));
const tick = (ms = 300) => act(async () => { vi.advanceTimersByTime(ms); });
const setVisibility = (value: DocumentVisibilityState) => act(async () => { Object.defineProperty(document, 'visibilityState', { value, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });

test('המצלמה נפתחת רק בלחיצה על "התחל סריקה", והלחיצה משחררת הקראה ב-iOS', async () => {
  const cam = fakeCamera(); const { speak } = alerts(); renderScan();
  expect(cam.start).not.toHaveBeenCalled(); expect(screen.getByLabelText('העלה תמונה')).toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'סיימתי' })).toBeNull();
  await startTap();
  expect(cam.start).toHaveBeenCalledExactlyOnceWith(document.querySelector('video')); expect(speak).toHaveBeenCalledExactlyOnceWith('');
  expect(screen.getByRole('button', { name: 'סיימתי' })).toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'התחל סריקה' })).toBeNull();
});
test('פסק דין חי כל 300ms; הקראה ורטט רק כשהרמה עולה', async () => {
  const cam = fakeCamera(); const { speak, vibrate } = alerts(); renderScan(); await startTap(); speak.mockClear();
  await tick(); expect(document.querySelector('[aria-live]')).toBeNull(); // no picture yet: no verdict at all, not even "no green"
  frame = clean; await tick();
  expect(cam.grab).toHaveBeenLastCalledWith(document.querySelector('video'), 256);
  expect(screen.getByText('לא זוהה ירוק')).toBeInTheDocument(); expect(speak).not.toHaveBeenCalled(); expect(vibrate).not.toHaveBeenCalled();
  frame = local; await tick(); await tick();
  expect(screen.getByText('הירקרקות מקומית')).toBeInTheDocument();
  expect(speak).toHaveBeenCalledExactlyOnceWith(VERDICT_TEXT.local.speech); expect(vibrate).toHaveBeenCalledExactlyOnceWith('local');
  frame = widespread; await tick(); frame = clean; await tick();
  expect(screen.getByText('הירקרקות נרחבת')).toBeInTheDocument(); // the worst side seen stays on screen
  expect(speak).toHaveBeenLastCalledWith(VERDICT_TEXT.widespread.speech); expect(vibrate).toHaveBeenLastCalledWith('widespread'); expect(vibrate).toHaveBeenCalledTimes(2);
});
test('הקראה ורטט כבויים בהגדרות: שקט, גם בלחיצת ההתחלה', async () => {
  fakeCamera(); const { speak, vibrate } = alerts(); renderScan({ speech: false, haptics: false }); await startTap();
  frame = widespread; await tick();
  expect(screen.getByText('הירקרקות נרחבת')).toBeInTheDocument(); expect(speak).not.toHaveBeenCalled(); expect(vibrate).not.toHaveBeenCalled();
});
test('תאורה לא תקינה: הודעה מהניתוח האחרון, פסק הדין קפוא, ובלי סימון', async () => {
  const cam = fakeCamera(); const { vibrate } = alerts(); renderScan(); await startTap();
  frame = tinted; await tick();
  expect(screen.getByText('לא זוהה ירוק')).toBeInTheDocument(); expect(screen.getByText('התאורה צבעונית מדי, נסה ליד חלון')).toBeInTheDocument(); expect(vibrate).not.toHaveBeenCalled();
  expect(cam.paint).not.toHaveBeenCalled();
  frame = local; await tick();
  expect(screen.getByText('הירקרקות מקומית')).toBeInTheDocument(); expect(screen.queryByText(/התאורה/)).toBeNull(); expect(cam.paint).toHaveBeenCalledTimes(1);
  frame = dark; await tick();
  expect(screen.getByText('הירקרקות מקומית')).toBeInTheDocument(); expect(screen.getByText('התאורה חלשה')).toBeInTheDocument(); expect(cam.paint).toHaveBeenCalledTimes(1);
});
test('טאב מוסתר עוצר מצלמה ולולאה; חזרה לטאב מפעילה לולאה אחת מחדש', async () => {
  const cam = fakeCamera(); renderScan(); await startTap();
  frame = clean; await tick(); expect(cam.grab).toHaveBeenCalledTimes(1);
  await setVisibility('hidden');
  expect(cam.stop).toHaveBeenCalled(); await tick(900); expect(cam.grab).toHaveBeenCalledTimes(1);
  await setVisibility('visible');
  expect(cam.start).toHaveBeenCalledTimes(2); await tick(); expect(cam.grab).toHaveBeenCalledTimes(2);
});
test('start שבוטל כי הטאב הוסתר: דחייה ב-AbortError לא מציגה "אין מצלמה", והצלחה שקטה לא מפעילה לולאה', async () => {
  const cam = fakeCamera(); let reject!: (e: unknown) => void, resolve!: () => void;
  cam.start.mockReturnValueOnce(new Promise((_, r) => { reject = r; })).mockReturnValueOnce(new Promise(r => { resolve = () => r(); }));
  renderScan(); await startTap();
  await setVisibility('hidden'); await act(async () => reject(new DOMException('aborted', 'AbortError')));
  expect(screen.queryByText(/אין גישה למצלמה/)).toBeNull();
  await setVisibility('visible'); await setVisibility('hidden'); await act(async () => resolve());
  frame = clean; await tick(900); expect(cam.grab).not.toHaveBeenCalled();
  await setVisibility('visible'); await tick(); expect(cam.grab).toHaveBeenCalledTimes(1);
});
test('סיימתי: onDone עם הפריים החמור ביותר, והמצלמה והלולאה נעצרות', async () => {
  const cam = fakeCamera(); const { onDone } = renderScan(); await startTap();
  frame = local; await tick(); frame = clean; await tick();
  await userEvent.click(screen.getByRole('button', { name: 'סיימתי' }));
  expect(onDone).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ worst: 'local', worstFrame: local }));
  expect(cam.stop).toHaveBeenCalled(); await tick(900); expect(cam.grab).toHaveBeenCalledTimes(2);
});
test('יציאה מהמסך עוצרת את המצלמה ומפסיקה להאזין לנראות הטאב', async () => {
  const cam = fakeCamera(); const { unmount } = renderScan(); await startTap();
  unmount(); expect(cam.stop).toHaveBeenCalled();
  await setVisibility('visible'); expect(cam.start).toHaveBeenCalledTimes(1);
});
test('העלאה בלי לחיצת התחלה: ניתוח ו-onDone מיד; תמונה חשוכה נותנת "לא זוהה ירוק" בלי פריים', async () => {
  const fromFile = vi.spyOn(cameraModule, 'frameFromFile').mockResolvedValueOnce(local).mockResolvedValueOnce(dark);
  const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
  const first = renderScan();
  await userEvent.upload(screen.getByLabelText('העלה תמונה'), file);
  expect(fromFile).toHaveBeenCalledWith(file, 256); expect(first.onDone).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ worst: 'local', worstFrame: local }));
  first.unmount(); const second = renderScan();
  await userEvent.upload(screen.getByLabelText('העלה תמונה'), file);
  expect(second.onDone).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ worst: 'none', worstFrame: null }));
});
test('אותו קובץ שוב אחרי "הקובץ לא נתמך": נבדק שוב ולא נבלע', async () => {
  const fromFile = vi.spyOn(cameraModule, 'frameFromFile').mockRejectedValue(new Error('unsupported'));
  const file = new File(['x'], 'a.heic', { type: 'image/heic' }); renderScan();
  await userEvent.upload(screen.getByLabelText('העלה תמונה'), file); await userEvent.upload(screen.getByLabelText('העלה תמונה'), file);
  expect(fromFile).toHaveBeenCalledTimes(2); expect(screen.getByText('הקובץ לא נתמך')).toBeInTheDocument();
});
