import { platform } from '../../platform';
import type { Settings } from '../../platform/storage';
import { HowToAnimation } from '../components/HowToAnimation';
import { DISCLAIMER, INFO_SECTIONS } from '../content/info';
import { INFO_TEXT } from '../strings';

const H2 = 'text-2xl font-bold';

export function InfoScreen({ settings, onSettings }: { settings: Settings; onSettings: (s: Settings) => void }) {
  return (
    <div className="space-y-8 p-4 text-xl">
      <h1 className="text-3xl font-bold">{INFO_TEXT.title}</h1>
      {INFO_SECTIONS.map(s => (
        <section key={s.title} className="space-y-2">
          <h2 className={H2}>{s.title}</h2>
          <p>{s.body}</p>
          <p className="text-lg">{s.source.includes(',') ? INFO_TEXT.sources : INFO_TEXT.source} {s.source}</p>
        </section>
      ))}
      <section className="space-y-3">
        <h2 className={H2}>{INFO_TEXT.howTo}</h2>
        <HowToAnimation />
      </section>
      <section className="space-y-3">
        <h2 className={H2}>{INFO_TEXT.settings}</h2>
        {!platform.speech.hasHebrewVoice() && <p>{INFO_TEXT.noHebrewVoice}</p>}
        {(['speech', 'haptics'] as const).map(key => (
          <label key={key} className="flex min-h-14 items-center justify-between gap-4 text-2xl">
            {INFO_TEXT[key]}
            <input type="checkbox" role="switch" aria-label={INFO_TEXT[key]} checked={settings[key]} onChange={() => onSettings({ ...settings, [key]: !settings[key] })} className="size-8" />
          </label>
        ))}
      </section>
      <section className="space-y-2">
        <h2 className={H2}>{INFO_TEXT.disclaimer}</h2>
        <p>{DISCLAIMER}</p>
      </section>
    </div>
  );
}
