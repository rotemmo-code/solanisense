export interface Speech { speak(text: string): void; hasHebrewVoice(): boolean; cancel(): void }

// looked up on every call: the shared instance is created at import, and some WebViews have no speech synthesis
const synth = (): SpeechSynthesis | undefined => globalThis.speechSynthesis;

export class WebSpeech implements Speech {
  // shortcut: Chrome loads voices only after a first getVoices() call (this one), so hasHebrewVoice can read false just after startup, upgrade to a voiceschanged listener if a screen asks that early
  constructor() { synth()?.getVoices(); }

  speak(text: string): void {
    const s = synth();
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'he-IL';
    u.rate = 0.95;
    s.speak(u);
  }

  // he, he-IL or he_IL (older Android uses underscores), and iw, the legacy Hebrew code of Java and Android locales
  hasHebrewVoice(): boolean { return synth()?.getVoices().some(v => /^(he|iw)([-_]|$)/i.test(v.lang)) ?? false; }

  cancel(): void { synth()?.cancel(); }
}
