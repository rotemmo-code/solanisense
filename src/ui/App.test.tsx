import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import html from '../../index.html?raw';
import { makeFrame } from '../core/analyzer/testFrames';
import { platform } from '../platform';
import * as cameraModule from '../platform/camera';
import * as storage from '../platform/storage';
import { VERDICT_TEXT } from './strings';
import App from './App';

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

test('מתחיל בסריקה, עובר למידע וחזרה', async () => { render(<App />); expect(screen.getByRole('button', { name: 'סריקה' })).toHaveAttribute('aria-current', 'page'); await userEvent.click(screen.getByRole('button', { name: 'מידע' })); expect(screen.getByText(/הצהרת אחריות/)).toBeInTheDocument(); });
test('שורש RTL ועברית', () => { expect(document.documentElement.getAttribute('dir')).toBe('rtl'); expect(document.documentElement.getAttribute('lang')).toBe('he'); });

// Added: the test above reads attributes test-setup sets, so this one checks the page the browser loads; then the way back,
// the result as a state of the scan, a fresh scan each time, and settings loaded once and saved on change
test('index.html עצמו מגדיר עברית ו-RTL על השורש', () => { expect(html).toMatch(/<html lang="he" dir="rtl">/); });
test('יציאה באמצע סריקה עוצרת את המצלמה, וחזרה לסריקה פותחת מסך חדש שמחכה ללחיצה', async () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null); // jsdom has no canvas; the overlay asks for one to draw the ROI guide
  const start = vi.spyOn(platform.camera, 'start').mockResolvedValue(); const stop = vi.spyOn(platform.camera, 'stop').mockImplementation(() => {});
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: 'התחל סריקה' })); expect(start).toHaveBeenCalledTimes(1);
  await userEvent.click(screen.getByRole('button', { name: 'מידע' }));
  expect(stop).toHaveBeenCalled(); expect(screen.getByRole('button', { name: 'מידע' })).toHaveAttribute('aria-current', 'page'); expect(screen.getByRole('button', { name: 'סריקה' })).not.toHaveAttribute('aria-current');
  await userEvent.click(screen.getByRole('button', { name: 'סריקה' }));
  expect(screen.getByRole('button', { name: 'סריקה' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('button', { name: 'התחל סריקה' })).toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'סיימתי' })).toBeNull(); expect(start).toHaveBeenCalledTimes(1);
});
test('העלאה מובילה לתוצאה, שבה "סריקה" פעיל; "סרוק עוד אחד" פותח סריקה חדשה', async () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null); // jsdom has no canvas; ResultScreen.test covers the drawing
  const local = makeFrame(20, 20, (x, y) => (x >= 9 && x < 12 && y >= 9 && y < 12 ? [110, 160, 70] : [190, 150, 100])); // 4% green
  vi.spyOn(cameraModule, 'frameFromFile').mockResolvedValue(local);
  render(<App />);
  await userEvent.upload(screen.getByLabelText('העלה תמונה'), new File(['x'], 'a.jpg', { type: 'image/jpeg' }));
  expect(await screen.findByText('הירקרקות מקומית')).toBeInTheDocument(); expect(screen.getByText('4%')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'סריקה' })).toHaveAttribute('aria-current', 'page'); expect(screen.queryByLabelText('העלה תמונה')).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'סרוק עוד אחד' }));
  expect(screen.getByRole('button', { name: 'התחל סריקה' })).toBeInTheDocument(); expect(screen.queryByText('הירקרקות מקומית')).toBeNull();
});
test('ההגדרות נטענות פעם אחת, מגיעות למסך המידע, ונשמרות בכל שינוי', async () => {
  const load = vi.spyOn(storage, 'loadSettings').mockReturnValue({ speech: false, haptics: true });
  const save = vi.spyOn(storage, 'saveSettings').mockImplementation(() => {});
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: 'מידע' }));
  expect(screen.getByRole('switch', { name: 'הקראה קולית' })).not.toBeChecked(); expect(save).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('switch', { name: 'רטט' }));
  expect(screen.getByRole('switch', { name: 'רטט' })).not.toBeChecked(); expect(save).toHaveBeenCalledExactlyOnceWith({ speech: false, haptics: false });
  await userEvent.click(screen.getByRole('button', { name: 'סריקה' })); await userEvent.click(screen.getByRole('button', { name: 'מידע' }));
  expect(screen.getByRole('switch', { name: 'רטט' })).not.toBeChecked(); expect(load).toHaveBeenCalledTimes(1);
});
// Fix wave: an upload's result is spoken by the result screen, with the settings App loaded
test('העלאה: מסך התוצאה מקריא את פסק הדין פעם אחת אחרי שחרור ההקראה, ולא רוטט כשהרטט כבוי', async () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.spyOn(cameraModule, 'frameFromFile').mockResolvedValue(makeFrame(20, 20, (x, y) => (x >= 9 && x < 12 && y >= 9 && y < 12 ? [110, 160, 70] : [190, 150, 100])));
  vi.spyOn(storage, 'loadSettings').mockReturnValue({ speech: true, haptics: false });
  const speak = vi.spyOn(platform.speech, 'speak').mockImplementation(() => {}), vibrate = vi.spyOn(platform.haptics, 'vibrate').mockImplementation(() => {});
  render(<App />);
  await userEvent.upload(screen.getByLabelText('העלה תמונה'), new File(['x'], 'a.jpg', { type: 'image/jpeg' }));
  expect(await screen.findByText('הירקרקות מקומית')).toBeInTheDocument();
  expect(speak.mock.calls).toEqual([[''], [VERDICT_TEXT.local.speech]]); expect(vibrate).not.toHaveBeenCalled();
});
