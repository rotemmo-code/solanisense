import { platform } from '../../platform';
import type { Settings } from '../../platform/storage';
import { HowToAnimation } from '../components/HowToAnimation';
import { Icon } from '../components/Icon';
import { DISCLAIMER, INFO_SECTIONS } from '../content/info';
import { INFO_TEXT } from '../strings';
import { CARD } from '../styles';

const H2 = 'flex items-center gap-3 text-2xl font-bold';
const SECTION = `${CARD} space-y-3`;

export function InfoScreen({ settings, onSettings }: { settings: Settings; onSettings: (s: Settings) => void }) {
  return (
    <div className="space-y-4 p-4 text-xl">
      <h1 className="flex items-center gap-3 text-3xl font-bold"><Icon name="info" className="size-8" />{INFO_TEXT.title}</h1>
      {INFO_SECTIONS.map(s => (
        <section key={s.title} className={SECTION}>
          <h2 className={H2}>{s.title}</h2>
          <p>{s.body}</p>
          <p className="flex gap-2 text-lg text-text-muted"><Icon name="book" className="mt-0.5 size-6" /><span>{s.source.includes(',') ? INFO_TEXT.sources : INFO_TEXT.source} {s.source}</span></p>
        </section>
      ))}
      <section className={SECTION}>
        <h2 className={H2}><Icon name="knife" />{INFO_TEXT.howTo}</h2>
        <HowToAnimation />
      </section>
      <section className={SECTION}>
        <h2 className={H2}>{INFO_TEXT.settings}</h2>
        {!platform.speech.hasHebrewVoice() && <p className="text-text-muted">{INFO_TEXT.noHebrewVoice}</p>}
        {(['speech', 'haptics'] as const).map(key => (
          <label key={key} className="flex min-h-14 items-center justify-between gap-4 text-2xl">
            {INFO_TEXT[key]}
            <input type="checkbox" role="switch" aria-label={INFO_TEXT[key]} checked={settings[key]} onChange={() => onSettings({ ...settings, [key]: !settings[key] })} className="size-8 accent-primary" />
          </label>
        ))}
      </section>
      <section className={SECTION}>
        <h2 className={H2}><Icon name="shield" />{INFO_TEXT.disclaimer}</h2>
        <p>{DISCLAIMER}</p>
      </section>
    </div>
  );
}
