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
  const [result, setResult] = useState<{ snapshot: ScanSnapshot; source: 'live' | 'upload' } | null>(null); // the source decides whether a short live scan may say 'none'
  const [settings, setSettings] = useState(loadSettings);

  const changeSettings = (s: Settings) => { setSettings(s); saveSettings(s); };
  const showResult = (snapshot: ScanSnapshot, source: 'live' | 'upload') => { setResult({ snapshot, source }); setScreen('result'); };

  return (
    <div className="flex h-dvh flex-col bg-black text-white">
      <main className="min-h-0 flex-1 overflow-y-auto">
        {screen === 'scan' && <ScanScreen settings={settings} onDone={showResult} />}
        {screen === 'result' && result && <ResultScreen {...result} settings={settings} onAgain={() => setScreen('scan')} />}
        {screen === 'info' && <InfoScreen settings={settings} onSettings={changeSettings} />}
      </main>
      {/* the result is a state of the scan, not a destination of its own (spec 2.4) */}
      <NavBar active={screen === 'info' ? 'info' : 'scan'} onSelect={setScreen} />
    </div>
  );
}
