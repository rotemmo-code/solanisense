import { useState } from 'react';
import type { ScanSnapshot } from '../core/verdict';
import { loadSettings, type Settings, saveSettings } from '../platform/storage';
import { NavBar } from './components/NavBar';
import { InfoScreen } from './screens/InfoScreen';
import { ResultScreen } from './screens/ResultScreen';
import { ScanScreen } from './screens/ScanScreen';

export default function App() {
  // ScanScreen renders only on 'scan', so leaving it stops the camera and coming back starts a fresh scan
  const [screen, setScreen] = useState<'scan' | 'result' | 'info'>('scan');
  const [snapshot, setSnapshot] = useState<ScanSnapshot | null>(null);
  const [settings, setSettings] = useState(loadSettings);

  const changeSettings = (s: Settings) => { setSettings(s); saveSettings(s); };
  const showResult = (s: ScanSnapshot) => { setSnapshot(s); setScreen('result'); };

  return (
    <div className="flex h-dvh flex-col bg-black text-white">
      <main className="min-h-0 flex-1 overflow-y-auto">
        {screen === 'scan' && <ScanScreen settings={settings} onDone={showResult} />}
        {screen === 'result' && snapshot && <ResultScreen snapshot={snapshot} onAgain={() => setScreen('scan')} />}
        {screen === 'info' && <InfoScreen settings={settings} onSettings={changeSettings} />}
      </main>
      {/* the result is a state of the scan, not a destination of its own (spec 2.4) */}
      <NavBar active={screen === 'info' ? 'info' : 'scan'} onSelect={setScreen} />
    </div>
  );
}
