import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { THRESHOLDS as T } from '../../core/analyzer/thresholds';
import { platform } from '../../platform';
import { DEFAULT_SETTINGS } from '../../platform/storage';
import * as drawing from '../components/Overlay.drawing';
import { ADVICE_SOURCE, CULTIVAR_WARNING, NOTHING_ANALYZED, TOO_FEW_FRAMES, VERDICT_TEXT } from '../strings';
import { ResultScreen } from './ResultScreen';

// jsdom has no canvas: getContext answers null unless a test fakes a context
beforeEach(() => { vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const snap = { worst: 'local' as const, worstRatio: 0.042, worstFrame: { width: 2, height: 2, data: new Uint8ClampedArray(16) }, worstMask: new Uint8Array(4), okFrames: T.MIN_OK_FRAMES_FOR_NONE };
const base = { source: 'live' as const, settings: { speech: false, haptics: false }, onAgain: () => {} }; // fix wave: the result needs the snapshot's source, and speaks per the settings
test('מציג פסק דין, אחוז, הנחיה ואזהרת זנים', () => { render(<ResultScreen snapshot={snap} {...base} />); expect(screen.getByText('הירקרקות מקומית')).toBeInTheDocument(); expect(screen.getByText('4%')).toBeInTheDocument(); expect(screen.getByText(VERDICT_TEXT.local.advice)).toBeInTheDocument(); expect(screen.getByText(CULTIVAR_WARNING)).toBeInTheDocument(); expect(screen.getByText(ADVICE_SOURCE)).toBeInTheDocument(); }); // fix wave: the advice names its sources
test('סרוק עוד אחד', async () => { const f = vi.fn(); render(<ResultScreen snapshot={snap} {...base} onAgain={f} />); await userEvent.click(screen.getByRole('button', { name: 'סרוק עוד אחד' })); expect(f).toHaveBeenCalled(); });
// Replaces the brief's third test (controller ruling 1): no frame means nothing was judged, so no verdict, not even "no green"
test('בלי פריים (לא נסרק כלום): הודעה ניטרלית, בלי פסק דין, צורה, אחוז או תמונה', () => {
  render(<ResultScreen snapshot={{ ...snap, worstFrame: null, worstMask: null, worst: 'none', worstRatio: 0 }} {...base} />);
  expect(screen.getByText(NOTHING_ANALYZED)).toBeInTheDocument(); expect(document.querySelector('[data-shape]')).toBeNull();
  expect(screen.queryByText('לא זוהה ירוק')).toBeNull(); expect(screen.queryByText(/%/)).toBeNull(); expect(document.querySelector('canvas')).toBeNull();
  expect(screen.getByText(CULTIVAR_WARNING)).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'סרוק עוד אחד' })).toBeInTheDocument();
});

// Added: the drawing, the other two levels, the percent sentence, and the live region the e2e test reads
test('הפריים מצויר ב-putImageData ואז הסימון בקנה מידה 1, על canvas בגודל הפריים עם תיאור בעברית', () => {
  const ctx = { putImageData: vi.fn() };
  vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(ctx as never);
  const ImageDataFake = vi.fn(); vi.stubGlobal('ImageData', ImageDataFake); // jsdom has no ImageData either
  const draw = vi.spyOn(drawing, 'drawOverlay').mockImplementation(() => {});
  render(<ResultScreen snapshot={snap} {...base} />);
  const img = screen.getByRole('img') as HTMLCanvasElement;
  expect(img.tagName).toBe('CANVAS'); expect([img.width, img.height]).toEqual([2, 2]);
  expect(img).toHaveAccessibleName('התמונה שנסרקה: הירקרקות מקומית, 4% מהשטח בתמונה ירוק');
  expect(ImageDataFake).toHaveBeenCalledExactlyOnceWith(snap.worstFrame.data, 2, 2);
  expect(ctx.putImageData).toHaveBeenCalledExactlyOnceWith(ImageDataFake.mock.instances[0], 0, 0);
  expect(draw).toHaveBeenCalledExactlyOnceWith(ctx, snap.worstMask, 2, 2, 1, 1);
  expect(ctx.putImageData.mock.invocationCallOrder[0]).toBeLessThan(draw.mock.invocationCallOrder[0]); // the marks go over the picture
});
test('הירקרקות נרחבת: איקס באזור החי, אחוז מעוגל בתוך משפט, והנחיה', () => {
  render(<ResultScreen snapshot={{ ...snap, worst: 'widespread', worstRatio: 0.236 }} {...base} />);
  expect(document.querySelector('[aria-live="assertive"]')).toHaveTextContent('הירקרקות נרחבת'); expect(document.querySelector('[data-shape="x"]')).not.toBeNull();
  expect(screen.getByText('24%').closest('p')).toHaveTextContent('24% מהשטח בתמונה ירוק');
  expect(screen.getByText(VERDICT_TEXT.widespread.advice)).toBeInTheDocument();
});
test('לא זוהה ירוק עם פריים: וי והנחיה, בלי אחוז, כי מתחת לרצפת הרעש 0.8% היה מעוגל ל-1% וסותר את פסק הדין', () => {
  render(<ResultScreen snapshot={{ ...snap, worst: 'none', worstRatio: 0.008 }} {...base} />);
  expect(screen.getByText('לא זוהה ירוק')).toBeInTheDocument(); expect(document.querySelector('[data-shape="check"]')).not.toBeNull();
  expect(screen.getByText(VERDICT_TEXT.none.advice)).toBeInTheDocument(); expect(screen.queryByText(/%/)).toBeNull();
  expect(screen.getByRole('img')).toHaveAccessibleName('התמונה שנסרקה: לא זוהה ירוק');
});

// Fix wave: a live "none" needs MIN_OK_FRAMES_FOR_NONE well-lit frames; an upload is one deliberate image, and green needs no minimum
test('סריקה חיה קצרה מדי בלי ירוק: הודעה ניטרלית, בלי פסק דין, צורה, הנחיה או תמונה', () => {
  render(<ResultScreen snapshot={{ ...snap, worst: 'none', worstRatio: 0, okFrames: T.MIN_OK_FRAMES_FOR_NONE - 1 }} {...base} />);
  expect(screen.getByText(TOO_FEW_FRAMES)).toBeInTheDocument(); expect(document.querySelector('[data-shape]')).toBeNull();
  expect(screen.queryByText('לא זוהה ירוק')).toBeNull(); expect(screen.queryByText(VERDICT_TEXT.none.advice)).toBeNull(); expect(screen.queryByText(ADVICE_SOURCE)).toBeNull(); expect(document.querySelector('canvas')).toBeNull();
  expect(screen.getByText(CULTIVAR_WARNING)).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'סרוק עוד אחד' })).toBeInTheDocument();
});
test('מספיק פריימים, העלאה של תמונה אחת, או ירוק כבר בפריים הראשון: פסק דין', () => {
  const enough = render(<ResultScreen snapshot={{ ...snap, worst: 'none', worstRatio: 0 }} {...base} />);
  expect(document.querySelector('[data-shape="check"]')).not.toBeNull(); enough.unmount();
  const upload = render(<ResultScreen snapshot={{ ...snap, worst: 'none', worstRatio: 0, okFrames: 1 }} {...base} source="upload" />);
  expect(screen.getByText('לא זוהה ירוק')).toBeInTheDocument(); expect(screen.queryByText(TOO_FEW_FRAMES)).toBeNull(); upload.unmount();
  render(<ResultScreen snapshot={{ ...snap, okFrames: 1 }} {...base} />);
  expect(screen.getByText('הירקרקות מקומית')).toBeInTheDocument(); expect(screen.queryByText(TOO_FEW_FRAMES)).toBeNull();
});

// Fix wave: the result speaks and vibrates its verdict once, per the settings; a neutral message stays silent
const alerts = () => ({ speak: vi.spyOn(platform.speech, 'speak').mockImplementation(() => {}), vibrate: vi.spyOn(platform.haptics, 'vibrate').mockImplementation(() => {}) });
test.each(['none', 'local', 'widespread'] as const)('תוצאה %s: הקראה ורטט פעם אחת, גם אחרי רינדור חוזר', (v) => {
  const { speak, vibrate } = alerts(); const snapshot = { ...snap, worst: v };
  const { rerender } = render(<ResultScreen snapshot={snapshot} {...base} settings={DEFAULT_SETTINGS} />);
  rerender(<ResultScreen snapshot={snapshot} {...base} settings={DEFAULT_SETTINGS} />);
  expect(speak).toHaveBeenCalledExactlyOnceWith(VERDICT_TEXT[v].speech);
  expect(vibrate).toHaveBeenCalledExactlyOnceWith(v); // 'none' maps to an empty pattern, which WebHaptics skips (haptics.test)
});
test('רק מה שמופעל בהגדרות; הודעה ניטרלית שותקת', () => {
  const { speak, vibrate } = alerts();
  render(<ResultScreen snapshot={snap} {...base} settings={{ speech: true, haptics: false }} />).unmount();
  expect(speak).toHaveBeenCalledExactlyOnceWith(VERDICT_TEXT.local.speech); expect(vibrate).not.toHaveBeenCalled();
  render(<ResultScreen snapshot={snap} {...base} settings={{ speech: false, haptics: true }} />).unmount();
  expect(vibrate).toHaveBeenCalledExactlyOnceWith('local'); expect(speak).toHaveBeenCalledTimes(1);
  speak.mockClear(); vibrate.mockClear();
  render(<ResultScreen snapshot={{ ...snap, worst: 'none', worstRatio: 0, okFrames: 1 }} {...base} settings={DEFAULT_SETTINGS} />).unmount(); // too few frames
  render(<ResultScreen snapshot={{ ...snap, worst: 'none', worstRatio: 0, worstFrame: null, worstMask: null }} {...base} settings={DEFAULT_SETTINGS} />); // nothing analyzed
  expect(speak).not.toHaveBeenCalled(); expect(vibrate).not.toHaveBeenCalled();
});
