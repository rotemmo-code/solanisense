import { render, screen } from '@testing-library/react';
import * as strings from '../strings';
import { VERDICT_TEXT } from '../strings';
import { VerdictBanner } from './VerdictBanner';

test.each([['none', 'לא זוהה ירוק', 'check'], ['local', 'הירקרקות מקומית', 'triangle'], ['widespread', 'הירקרקות נרחבת', 'x']] as const)('%s', (v, text, shape) => { render(<VerdictBanner verdict={v} lighting="ok" />); expect(screen.getByText(text)).toBeInTheDocument(); expect(document.querySelector(`[data-shape="${shape}"]`)).not.toBeNull(); expect(document.querySelector('[aria-live="assertive"]')).not.toBeNull(); });
test('תאורה חלשה מציגה הודעה', () => { render(<VerdictBanner verdict="none" lighting="dark" />); expect(screen.getByText('התאורה חלשה')).toBeInTheDocument(); });
test('אף מחרוזת לא מכילה "בטוח"', () => { expect(JSON.stringify(VERDICT_TEXT)).not.toContain('בטוח'); });

// Added: the shape is hidden from screen readers and sits with the text inside the live region; tinted light; no lighting line when ok; every UI string, not only the verdicts
test('הצורה מוסתרת מקורא מסך ונמצאת עם הטקסט באזור החי', () => {
  render(<VerdictBanner verdict="local" lighting="ok" />);
  const live = document.querySelector('[aria-live="assertive"]')!, svg = document.querySelector<SVGElement>('svg[data-shape]')!;
  expect(svg).toHaveAttribute('aria-hidden', 'true'); expect(live).toContainElement(svg); expect(live).toContainElement(screen.getByText('הירקרקות מקומית'));
});
test('תאורה צבעונית מציגה הודעה; תאורה תקינה בלי הודעה', () => {
  const { rerender } = render(<VerdictBanner verdict="none" lighting="tinted" />);
  expect(screen.getByText('התאורה צבעונית מדי, נסה ליד חלון')).toBeInTheDocument();
  rerender(<VerdictBanner verdict="none" lighting="ok" />);
  expect(screen.queryByText(/התאורה/)).toBeNull();
});
test('אף מחרוזת UI לא מכילה "בטוח" או "רמת סולנין"', () => { const all = JSON.stringify(strings); expect(all).toContain('התחל סריקה'); expect(all).not.toContain('בטוח'); expect(all).not.toContain('רמת סולנין'); });
