import { WebSpeech } from './speech';

// jsdom has no speech synthesis, so deleting restores it
afterEach(() => { delete (globalThis as any).speechSynthesis; delete (globalThis as any).SpeechSynthesisUtterance; });

test('בלי speechSynthesis: hasHebrewVoice false, speak לא זורק', () => { (globalThis as any).speechSynthesis = undefined; const s = new WebSpeech(); expect(s.hasHebrewVoice()).toBe(false); expect(() => s.speak('שלום')).not.toThrow(); });
test('עם קול he-IL: true ו-speak עם lang he-IL', () => { const speak = vi.fn(); (globalThis as any).speechSynthesis = { getVoices: () => [{ lang: 'he-IL' }], speak, cancel: vi.fn() }; (globalThis as any).SpeechSynthesisUtterance = class { lang = ''; text = ''; rate = 1; constructor(t: string) { this.text = t; } }; const s = new WebSpeech(); expect(s.hasHebrewVoice()).toBe(true); s.speak('שלום'); expect(speak.mock.calls[0][0].lang).toBe('he-IL'); });

// Added: cancel before speak and the rate, the Hebrew codes browsers report, the shared instance made before speech exists, the voice-list warm-up
const stubSynth = (langs: string[]) => {
  const synth = { getVoices: vi.fn(() => langs.map(lang => ({ lang }))), speak: vi.fn(), cancel: vi.fn() };
  (globalThis as any).speechSynthesis = synth;
  (globalThis as any).SpeechSynthesisUtterance = class { lang = ''; text = ''; rate = 1; constructor(t: string) { this.text = t; } };
  return synth;
};
test('speak מבטל את ההקראה הקודמת ומקריא בעברית בקצב 0.95', () => {
  const synth = stubSynth(['he-IL']); new WebSpeech().speak('שלום');
  expect(synth.cancel.mock.invocationCallOrder[0]).toBeLessThan(synth.speak.mock.invocationCallOrder[0]);
  expect(synth.speak.mock.calls[0][0]).toMatchObject({ text: 'שלום', lang: 'he-IL', rate: 0.95 });
});
test.each<[string[], boolean]>([[['he'], true], [['he_IL'], true], [['HE-il'], true], [['iw_IL'], true], [['en-US', 'ar-IL', 'her'], false], [[], false]])('hasHebrewVoice(%j) = %s', (langs, expected) => { stubSynth(langs); expect(new WebSpeech().hasHebrewVoice()).toBe(expected); });
test('מופע שנוצר לפני שיש speechSynthesis משתמש בו כשהוא מופיע', () => {
  const s = new WebSpeech(); expect(() => s.cancel()).not.toThrow();
  const synth = stubSynth(['he-IL']); expect(s.hasHebrewVoice()).toBe(true); s.cancel(); expect(synth.cancel).toHaveBeenCalled();
});
test('היצירה מבקשת את רשימת הקולות, כדי ש-Chrome יתחיל לטעון אותה', () => { const synth = stubSynth([]); new WebSpeech(); expect(synth.getVoices).toHaveBeenCalled(); });
