import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { platform } from '../../platform';
import { DEFAULT_SETTINGS } from '../../platform/storage';
import { HowToAnimation } from '../components/HowToAnimation';
import { DISCLAIMER, INFO_SECTIONS } from '../content/info';
import { HOWTO_TEXT } from '../strings';
import { InfoScreen } from './InfoScreen';

// jsdom has neither speech synthesis nor matchMedia, so deleting restores them. Unmount only after that: HowToAnimation cancels speech
// on unmount, and the voice test's stub has no cancel(). Explicit, so it does not hang on the order of RTL's own cleanup hook.
afterEach(() => { delete (globalThis as any).speechSynthesis; delete (window as any).matchMedia; cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

test('כל סעיף מציג מקור', () => { render(<InfoScreen settings={DEFAULT_SETTINGS} onSettings={() => {}} />); INFO_SECTIONS.forEach(s => { expect(screen.getByText(s.title)).toBeInTheDocument(); expect(screen.getAllByText(new RegExp(s.source)).length).toBeGreaterThan(0); }); });
test('הצהרת אחריות מוצגת', () => { render(<InfoScreen settings={DEFAULT_SETTINGS} onSettings={() => {}} />); expect(screen.getByText(/לא נבטים ולא רקב/)).toBeInTheDocument(); });
test('מתג הקראה', async () => { const f = vi.fn(); render(<InfoScreen settings={DEFAULT_SETTINGS} onSettings={f} />); await userEvent.click(screen.getByLabelText('הקראה קולית')); expect(f).toHaveBeenCalledWith({ speech: false, haptics: true }); });
test('אין קול עברי: הודעה', () => { (globalThis as any).speechSynthesis = { getVoices: () => [] }; render(<InfoScreen settings={DEFAULT_SETTINGS} onSettings={() => {}} />); expect(screen.getByText(/אין קול עברי/)).toBeInTheDocument(); });
test('אנימציה: שלושה שלבים וכפתור הבא', async () => { render(<HowToAnimation />); expect(screen.getByText(/שלב 1/)).toBeInTheDocument(); await userEvent.click(screen.getByRole('button', { name: 'הבא' })); expect(screen.getByText(/שלב 2/)).toBeInTheDocument(); });
test('אין "בטוח" בתוכן', () => { expect(JSON.stringify(INFO_SECTIONS) + DISCLAIMER).not.toContain('בטוח'); });

// Added: both switches mirror the settings, the voice notice hides when a Hebrew voice exists, the disclaimer's parts, the source tokens,
// and the animation's timing: every 4 s with wrap-around, none under reduced motion, a press hands control to the user, read speaks, unmount clears
test('המתגים משקפים את ההגדרות, וכל אחד הופך רק את השדה שלו', async () => {
  const f = vi.fn(); render(<InfoScreen settings={{ speech: false, haptics: true }} onSettings={f} />);
  expect(screen.getByRole('switch', { name: 'הקראה קולית' })).not.toBeChecked(); expect(screen.getByRole('switch', { name: 'רטט' })).toBeChecked();
  await userEvent.click(screen.getByLabelText('רטט')); expect(f).toHaveBeenLastCalledWith({ speech: false, haptics: false });
  await userEvent.click(screen.getByLabelText('הקראה קולית')); expect(f).toHaveBeenLastCalledWith({ speech: true, haptics: true });
});
test('יש קול עברי: בלי הודעה', () => { vi.spyOn(platform.speech, 'hasHebrewVoice').mockReturnValue(true); render(<InfoScreen settings={DEFAULT_SETTINGS} onSettings={() => {}} />); expect(screen.queryByText(/אין קול עברי/)).toBeNull(); });
test('הצהרת האחריות מכסה את כל הסייגים, ואין "רמת סולנין" בתוכן', () => {
  ['מזהה ירוק בלבד', 'לא נבטים ולא רקב', 'ממלא את המסגרת', 'הנדסיים', 'לא מאומתים רפואית', 'באור טבעי או לבן', 'לא לאכול'].forEach(part => expect(DISCLAIMER).toContain(part));
  expect(JSON.stringify(INFO_SECTIONS) + DISCLAIMER).not.toContain('רמת סולנין');
});
test('בישול לא עוזר: עמידות בחום וטיגון שמוריד רק כ-40 אחוז, עם CFS ו-Oregon State שאומרים זאת', () => {
  const cooking = INFO_SECTIONS.find(s => s.title === 'בישול לא עוזר')!;
  expect(cooking.body).toMatch(/עמיד בחום.*230/); expect(cooking.body).toContain('כ-40 אחוז');
  expect(cooking.source.split(', ')).toEqual(expect.arrayContaining(['CFS הונג קונג', 'Oregon State']));
});
test('כל מקור הוא אחד מארבעת השמות המוכרים, וכל אחד מהם מצוטט', () => {
  expect(new Set(INFO_SECTIONS.flatMap(s => s.source.split(', ')))).toEqual(new Set(['BfR', 'CFS הונג קונג', 'Oregon State', 'ספרות']));
});

const fakeIntervals = () => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] }); // user-event and React keep their real timers
const advance = (ms: number) => act(async () => { vi.advanceTimersByTime(ms); });
const caption = () => screen.getByText(/^שלב \d/).textContent;
test('אנימציה: מתקדמת לבד כל 4 שניות, חוזרת להתחלה, ויציאה מנקה את הטיימר', async () => {
  fakeIntervals(); const { unmount } = render(<HowToAnimation />);
  await advance(3999); expect(caption()).toBe(HOWTO_TEXT.steps[0]);
  await advance(1); expect(caption()).toBe(HOWTO_TEXT.steps[1]);
  await advance(4000); expect(caption()).toBe(HOWTO_TEXT.steps[2]);
  await advance(4000); expect(caption()).toBe(HOWTO_TEXT.steps[0]);
  expect(vi.getTimerCount()).toBe(1); unmount(); expect(vi.getTimerCount()).toBe(0);
});
test('אנימציה: לחיצה מעבירה את השליטה למשתמש, והקודם משלב 1 עובר לשלב 3', async () => {
  fakeIntervals(); render(<HowToAnimation />);
  await userEvent.click(screen.getByRole('button', { name: 'הקודם' })); expect(caption()).toBe(HOWTO_TEXT.steps[2]);
  await advance(4000); expect(caption()).toBe(HOWTO_TEXT.steps[2]); // one tick: three would loop back to the same step
  await userEvent.click(screen.getByRole('button', { name: 'הבא' })); expect(caption()).toBe(HOWTO_TEXT.steps[0]);
});
test('אנימציה: בלי מעבר אוטומטי כשהמשתמש ביקש פחות תנועה, והכפתורים עדיין עובדים', async () => {
  fakeIntervals(); window.matchMedia = ((q: string) => ({ matches: q === '(prefers-reduced-motion: reduce)' })) as never;
  render(<HowToAnimation />);
  await advance(4000); expect(caption()).toBe(HOWTO_TEXT.steps[0]); expect(vi.getTimerCount()).toBe(0);
  await userEvent.click(screen.getByRole('button', { name: 'הבא' })); expect(caption()).toBe(HOWTO_TEXT.steps[1]);
});
test('אנימציה: הקרא מקריא את השלב המוצג דרך platform.speech, השלב לא מתחלף באמצע ההקראה, ויציאה עוצרת אותה', async () => {
  fakeIntervals(); const speak = vi.spyOn(platform.speech, 'speak').mockImplementation(() => {}); const cancel = vi.spyOn(platform.speech, 'cancel').mockImplementation(() => {});
  const { unmount } = render(<HowToAnimation />);
  await userEvent.click(screen.getByRole('button', { name: 'הקרא' })); expect(speak).toHaveBeenLastCalledWith(HOWTO_TEXT.steps[0]);
  await advance(4000); expect(caption()).toBe(HOWTO_TEXT.steps[0]);
  await userEvent.click(screen.getByRole('button', { name: 'הבא' })); await userEvent.click(screen.getByRole('button', { name: 'הקרא' }));
  expect(speak).toHaveBeenLastCalledWith(HOWTO_TEXT.steps[1]); expect(speak).toHaveBeenCalledTimes(2);
  expect(cancel).not.toHaveBeenCalled(); // a press that turns auto off must not cut its own speech
  unmount(); expect(cancel).toHaveBeenCalledTimes(1);
});
