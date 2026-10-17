import { useEffect, useState } from 'react';
import { platform } from '../../platform';
import { HOWTO_TEXT } from '../strings';

const STEPS = HOWTO_TEXT.steps;
const BUTTON = 'min-h-14 flex-1 rounded-xl border-2 border-white px-2 text-xl font-bold';
const POTATO = <ellipse cx="128" cy="80" rx="86" ry="54" fill="#c9955b" stroke="#f3dcb5" strokeWidth="3" />;
// green is striped, never color alone, like the marks on the scan
const GREEN = { fill: 'url(#howto-green)', stroke: 'white', strokeWidth: 2 };

// flat drawings, one per step; step 3 reads right to left, potato to bin, as the RTL page does
const DRAWINGS = [
  <>
    {POTATO}
    <ellipse cx="150" cy="64" rx="34" ry="19" {...GREEN} />
    <g transform="rotate(-40 150 64)" stroke="#111" strokeWidth="2">
      <rect x="144" y="8" width="12" height="46" rx="6" fill="#9ca3af" />
      <rect x="132" y="52" width="36" height="14" rx="4" fill="#e5e7eb" />
      <path d="M137 59h26" />
    </g>
  </>,
  <>
    {POTATO}
    <ellipse cx="118" cy="84" rx="7" ry="4.5" fill="#4a2c12" />
    <circle cx="118" cy="84" r="16" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="5 4" />
    <g transform="translate(174 9) rotate(35)" stroke="#111" strokeWidth="2">
      <rect x="-6" y="0" width="12" height="36" rx="4" fill="#78716c" />
      <path d="M-5 36H5V62L0 78L-5 62Z" fill="#e5e7eb" />
    </g>
  </>,
  <>
    <ellipse cx="168" cy="80" rx="60" ry="40" fill="#c9955b" stroke="#f3dcb5" strokeWidth="3" />
    <ellipse cx="168" cy="80" rx="48" ry="30" {...GREEN} />
    <path d="M100 80H74" stroke="white" strokeWidth="5" strokeLinecap="round" />
    <path d="M62 80l14-10v20z" fill="white" />
    <g fill="none" stroke="white" strokeWidth="3" strokeLinejoin="round">
      <path d="M14 46h50M30 46v-8h18v8M20 54l5 70h28l5-70zM32 66v46M39 66v46M46 66v46" />
    </g>
  </>,
];

const reducedMotion = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** "How to clean" in three steps that advance every 4 s; the first button press stops that, so a step never changes while it is being read */
export function HowToAnimation() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || reducedMotion()) return;
    const timer = setInterval(() => setStep(s => (s + 1) % STEPS.length), 4000);
    return () => clearInterval(timer);
  }, [auto]);

  const go = (by: number) => { setAuto(false); setStep(s => (s + by + STEPS.length) % STEPS.length); };
  const read = () => { setAuto(false); platform.speech.speak(STEPS[step]); };

  return (
    <div className="space-y-3">
      <svg viewBox="0 0 240 150" aria-hidden="true" className="w-full">
        <defs>
          <pattern id="howto-green" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="#6f9a3a" />
            <path d="M4 0v8" stroke="black" strokeWidth="3.5" />
            <path d="M4 0v8" stroke="white" strokeWidth="1.5" />
          </pattern>
        </defs>
        {DRAWINGS[step]}
      </svg>
      {/* room for the longest caption, so the buttons below do not jump when the step changes */}
      <p className="min-h-[4lh] text-2xl">{STEPS[step]}</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => go(-1)} className={BUTTON}>{HOWTO_TEXT.prev}</button>
        <button type="button" onClick={read} className={BUTTON}>{HOWTO_TEXT.read}</button>
        <button type="button" onClick={() => go(1)} className={BUTTON}>{HOWTO_TEXT.next}</button>
      </div>
    </div>
  );
}
