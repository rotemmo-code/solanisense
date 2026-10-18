import { type ChangeEvent, useEffect, useEffectEvent, useRef, useState } from 'react';
import { LocalGreenAnalyzer } from '../../core/analyzer/localGreenAnalyzer';
import { THRESHOLDS as T } from '../../core/analyzer/thresholds';
import type { Lighting, Verdict } from '../../core/analyzer/types';
import { ScanState, type ScanSnapshot } from '../../core/verdict';
import { platform } from '../../platform';
import { frameFromFile } from '../../platform/camera';
import type { Settings } from '../../platform/storage';
import { type Marks, Overlay } from '../components/Overlay';
import { VerdictBanner } from '../components/VerdictBanner';
import { SCAN_HINT, SCAN_TEXT, VERDICT_TEXT } from '../strings';

const analyzer = new LocalGreenAnalyzer();
const FRAME_WIDTH = 256; // spec 4.1
const BUTTON = 'flex min-h-14 w-full items-center justify-center rounded-xl px-6 text-2xl font-bold';

export function ScanScreen({ settings, onDone }: { settings: Settings; onDone: (snap: ScanSnapshot, source: 'live' | 'upload') => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scan] = useState(() => new ScanState());
  // the camera waits for a start tap: that tap is the user gesture iOS needs before it speaks and Android before it vibrates
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'noCamera'>('idle');
  const [verdict, setVerdict] = useState<Verdict | null>(null); // null until a well-lit frame is analyzed: a check mark before that would judge nothing
  const [lighting, setLighting] = useState<Lighting>('ok');
  const [marks, setMarks] = useState<Marks | null>(null);
  const [unsupported, setUnsupported] = useState(false);

  const analyzeFrame = useEffectEvent((video: HTMLVideoElement) => {
    const frame = platform.camera.grabFrame(video, FRAME_WIDTH);
    if (!frame) return; // the video has no picture yet
    const result = analyzer.analyze(frame);
    if (scan.update(result, frame)) {
      const worst = scan.snapshot.worst;
      if (settings.speech) platform.speech.speak(VERDICT_TEXT[worst].speech);
      if (settings.haptics) platform.haptics.vibrate(worst);
    }
    const s = scan.snapshot;
    // a frame means a well-lit one was judged; 'none' also waits for a few seconds of them, since each frame sees one side, while green shows at once
    setVerdict(s.worstFrame && (s.worst !== 'none' || s.okFrames >= T.MIN_OK_FRAMES_FOR_NONE) ? s.worst : null);
    setLighting(result.lighting);
    setMarks(result.lighting === 'ok' ? { mask: result.mask, width: frame.width, height: frame.height } : null); // marks from a badly lit frame would mislead
  });

  useEffect(() => {
    if (phase !== 'scanning') return;
    const video = videoRef.current!;
    let attempt = 0; // bumped by stop(), so a start still in flight knows it was cancelled
    let timer: ReturnType<typeof setInterval> | undefined;
    const stop = () => { attempt++; clearInterval(timer); platform.camera.stop(); };
    const start = () => {
      const mine = ++attempt;
      platform.camera.start(video).then(
        // shortcut: setInterval instead of requestVideoFrameCallback, simpler and good enough at 300ms; upgrade if frame tearing is visible
        () => { if (mine === attempt) timer = setInterval(() => analyzeFrame(video), 300); },
        // a cancelled start may resolve silently or reject (AbortError); only a failure of the current attempt means no camera
        () => { if (mine === attempt) setPhase('noCamera'); },
      );
    };
    // a hidden tab must not keep the camera on and the analysis running
    const onVisibility = () => { stop(); if (document.visibilityState === 'visible') start(); };
    document.addEventListener('visibilitychange', onVisibility);
    start();
    return () => { document.removeEventListener('visibilitychange', onVisibility); stop(); };
  }, [phase]);

  const unlockSpeech = () => { if (settings.speech) platform.speech.speak(''); }; // iOS starts speech only inside a tap; this silent utterance unlocks the verdicts spoken later
  const begin = () => {
    unlockSpeech();
    scan.reset(); // a new scan on the same mount must not inherit the last one's worst, nor show its verdict, lighting or marks
    setVerdict(null); setLighting('ok'); setMarks(null);
    setPhase('scanning');
  };
  const finish = (source: 'live' | 'upload') => { setPhase('idle'); onDone(scan.snapshot, source); }; // leaving 'scanning' stops the camera and the loop

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // so choosing the same file again still fires change
    if (!file) return;
    setUnsupported(false);
    try {
      const frame = await frameFromFile(file, FRAME_WIDTH);
      scan.update(analyzer.analyze(frame), frame);
    } catch {
      setUnsupported(true);
      return;
    }
    finish('upload');
  };

  return (
    <div className="flex h-full flex-col bg-black text-white">
      {phase !== 'noCamera' && (
        <div className="space-y-2 p-4">
          {phase === 'scanning' && <VerdictBanner verdict={verdict} lighting={lighting} />}
          <p className="text-xl">{SCAN_HINT}</p>
        </div>
      )}
      <div className="relative flex min-h-0 flex-1 items-center justify-center p-4">
        {phase === 'scanning' && (
          <>
            <video ref={videoRef} className="absolute inset-0 size-full object-contain" />
            <Overlay marks={marks} />
          </>
        )}
        {phase === 'idle' && <button type="button" onClick={begin} className={`${BUTTON} bg-white text-black`}>{SCAN_TEXT.start}</button>}
        {phase === 'noCamera' && <p role="alert" className="text-2xl">{SCAN_TEXT.noCamera}</p>}
      </div>
      <div className="flex flex-col gap-3 p-4">
        {phase === 'scanning' && <button type="button" onClick={() => finish('live')} className={`${BUTTON} bg-white text-black`}>{SCAN_TEXT.done}</button>}
        <label className={`${BUTTON} cursor-pointer border-2 border-white focus-within:outline-4 focus-within:outline-offset-2 focus-within:outline-white`}>
          {SCAN_TEXT.upload}
          {/* the tap that opens the picker unlocks speech too: the result screen speaks the upload's verdict after the decode, outside any tap */}
          <input type="file" accept="image/*" aria-label={SCAN_TEXT.upload} onClick={unlockSpeech} onChange={onFile} className="sr-only" />
        </label>
        {unsupported && <p role="alert" className="text-2xl">{SCAN_TEXT.unsupported}</p>}
      </div>
    </div>
  );
}
