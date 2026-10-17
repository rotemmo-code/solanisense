# SolaniSense שלב 1: תוכנית מימוש

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PWA בעברית שסורקת תפוח אדמה במצלמה חיה, מסמנת אזורים ירוקים, ומציגה שלוש רמות עם טקסט, צורה, הקראה ורטט.

**Architecture:** שלוש שכבות. `src/core` הוא TypeScript טהור (ניתוח צבע ב-CIELAB, פסק דין, מצב סריקה) ונבדק ביחידה. `src/platform` עוטף Web API (מצלמה, הקראה, רטט, אחסון) מאחורי ממשקים. `src/ui` הוא React שמחבר ביניהם. אין ראוטר: מצב מסך ב-`App`.

**Tech Stack:** Node 24, Vite 7, React 19, TypeScript 5, Tailwind 4, vite-plugin-pwa, Vitest, Playwright. כולם MIT או Apache-2.0. לרשום ב-`docs/licenses.md` בעת ההתקנה.

**Spec:** `docs/superpowers/specs/2026-10-17-solanisense-design.md`

## Global Constraints

- `dir="rtl"` ו-`lang="he"` על `<html>`. כל מחרוזת למשתמש בעברית. אין מחרוזות אנגליות ב-UI.
- `src/core/**` לא מייבא מ-`react`, מ-`src/platform`, מ-`src/ui`, ולא משתמש ב-`document`, `window`, `navigator`, `ImageData`, `canvas`. בדיקה: `npm run lint:core` (grep) בתוך `npm test`.
- כל סף מספרי של הזיהוי נמצא רק ב-`src/core/analyzer/thresholds.ts`.
- האפליקציה לא מציגה את המילה "בטוח" ולא "רמת סולנין".
- כל פסק דין: טקסט בגודל 40 פיקסל לפחות, צורה (וי בעיגול, משולש, איקס), הקראה, רטט.
- כפתורים בגובה 56 פיקסל לפחות.
- כל הנחיה בריאותית במסך המידע מלווה בשם המקור (BfR, CFS הונג קונג, Oregon State).
- לפני התקנת כל חבילה: לבדוק `license` ב-package.json שלה, לרשום ב-`docs/licenses.md`. רק MIT, Apache-2.0, BSD-2/3, ISC, 0BSD.
- commit אחרי כל משימה. הודעות commit באנגלית בפורמט `type: subject`, עם שורת `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- כל קיצור דרך מכוון: `// shortcut: <המגבלה>, <מתי לשדרג>`.

## Review Focus

1. פריים ללא תפוח אדמה (קיר לבן, שולחן): a* חציוני קרוב ל-0, אין פיקסלים ירוקים, פסק דין "לא זוהה ירוק". המשתמש עלול לחשוב שתפוח האדמה נבדק. הבדיקה במשימה 4 (`all-white`). הטיפול: הנחיה "מלא את המסגרת" קבועה במסך הסריקה (משימה 7).
2. רקע ירוק (דשא, מגבת ירוקה) ממלא את המסגרת: "הירקרקות נרחבת" כוזבת. הבדיקה במשימה 4 (`all-green`, מצופה widespread). הטיפול: הצהרת האחריות (משימה 9). אין הפרדת רקע בשלב זה.
3. הטאב מוסתר או המסך כבוי: לולאת הניתוח ממשיכה ומרוקנת סוללה. הבדיקה במשימה 7: `visibilitychange` עוצר את הלולאה.
4. אין קול עברי במכשיר: `speechSynthesis.speak` רץ בקול אנגלי או שותק. הבדיקה במשימה 6: `hasHebrewVoice()` מחזיר false כשאין קול `he`, ו-`speak` לא זורק.
5. תמונה שהועלתה בפורמט לא נתמך (HEIC): `createImageBitmap` נכשל. הבדיקה במשימה 7: שגיאה מוצגת "הקובץ לא נתמך", האפליקציה לא קורסת.

---

### Task 1: Scaffold הפרויקט

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/ui/App.tsx`, `src/index.css`, `vitest.config.ts`, `docs/licenses.md`, `scripts/lint-core.sh`
- Test: `src/ui/App.test.tsx`

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm test` (vitest + lint:core), `npm run lint:core`.

- [ ] **Step 1: צור פרויקט Vite**

Run: `npm create vite@latest . -- --template react-ts` (בתיקייה הקיימת; אם מסרב בגלל קבצים קיימים, צור בתיקיית temp והעתק). התקן: `npm i -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom`.
לפני כל התקנה: `npm view <pkg> license`. רשום ב-`docs/licenses.md` טבלה: חבילה, גרסה, רישיון.

- [ ] **Step 2: הגדר RTL ו-Tailwind**

`index.html`: `<html lang="he" dir="rtl">`, `<title>SolaniSense</title>`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
`src/index.css`: `@import "tailwindcss";`.
`vite.config.ts`: plugins `react()`, `tailwindcss()`.

- [ ] **Step 3: כתוב בדיקת עשן נכשלת**

```tsx
// src/ui/App.test.tsx
import { render, screen } from '@testing-library/react';
import App from './App';
test('מציג את שם האפליקציה', () => {
  render(<App />);
  expect(screen.getByText('SolaniSense')).toBeInTheDocument();
});
```

- [ ] **Step 4: הרץ, ודא כישלון**

Run: `npx vitest run`. Expected: FAIL (App לא מציג את הטקסט או לא קיים).

- [ ] **Step 5: `App.tsx` מינימלי שמציג `<h1>SolaniSense</h1>`**

`vitest.config.ts`: `environment: 'jsdom'`, `setupFiles: ['./src/test-setup.ts']` עם `import '@testing-library/jest-dom/vitest'`.

- [ ] **Step 6: `scripts/lint-core.sh`**

```bash
#!/usr/bin/env bash
set -e
if grep -rnE "from 'react'|from \"react\"|src/platform|src/ui|\bdocument\b|\bwindow\b|\bnavigator\b|\bImageData\b|canvas" src/core --include=*.ts | grep -v '\.test\.ts' ; then
  echo "core must stay pure"; exit 1
fi
echo "core is pure"
```
`package.json` scripts: `"test": "bash scripts/lint-core.sh && vitest run"`, `"lint:core": "bash scripts/lint-core.sh"`.

- [ ] **Step 7: הרץ `npm test`, ודא הצלחה. הרץ `npm run build`, ודא הצלחה.**

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: scaffold vite react ts tailwind vitest, rtl root"
```

---

### Task 2: המרת צבע RGB ל-CIELAB

**Files:**
- Create: `src/core/analyzer/color.ts`
- Test: `src/core/analyzer/color.test.ts`

**Interfaces:**
- Produces: `rgbToLab(r: number, g: number, b: number): [L: number, a: number, b: number]` (sRGB 0..255, D65, L 0..100).

- [ ] **Step 1: בדיקה נכשלת עם ערכים ידועים**

```ts
import { rgbToLab } from './color';
const close = (x: number, y: number, tol = 1) => Math.abs(x - y) <= tol;
test('לבן', () => { const [L, a, b] = rgbToLab(255, 255, 255); expect(close(L, 100)).toBe(true); expect(close(a, 0)).toBe(true); expect(close(b, 0)).toBe(true); });
test('שחור', () => { const [L] = rgbToLab(0, 0, 0); expect(close(L, 0)).toBe(true); });
test('ירוק טהור a* שלילי חזק', () => { const [, a] = rgbToLab(0, 255, 0); expect(a).toBeLessThan(-70); });
test('אדום טהור a* חיובי', () => { const [, a] = rgbToLab(255, 0, 0); expect(a).toBeGreaterThan(70); });
test('חום תפוח אדמה a* חיובי קטן', () => { const [, a] = rgbToLab(190, 150, 100); expect(a).toBeGreaterThan(5); expect(a).toBeLessThan(20); });
```

- [ ] **Step 2: הרץ `npx vitest run src/core/analyzer/color.test.ts`, ודא FAIL.**

- [ ] **Step 3: ממש `rgbToLab` ב-`color.ts`**

sRGB → linear (gamma 2.4 עם סף 0.04045) → XYZ (מטריצת D65) → Lab עם נקודת לבן D65 (0.95047, 1.0, 1.08883). ללא ייבוא.

- [ ] **Step 4: הרץ, ודא PASS. הרץ `npm run lint:core`.**

- [ ] **Step 5: Commit** `feat(core): rgb to cielab conversion`

---

### Task 3: טיפוסים וספים

**Files:**
- Create: `src/core/analyzer/types.ts`, `src/core/analyzer/thresholds.ts`
- Test: `src/core/analyzer/thresholds.test.ts`

**Interfaces:**
- Produces:
```ts
// types.ts
export interface Frame { width: number; height: number; data: Uint8ClampedArray } // RGBA, תואם ImageData מבנית
export type Lighting = 'ok' | 'dark' | 'tinted';
export interface AnalysisResult { greenRatio: number; mask: Uint8Array; lighting: Lighting } // mask באורך width*height, 1 = ירוק
export interface Analyzer { analyze(frame: Frame): AnalysisResult }
export type Verdict = 'none' | 'local' | 'widespread';
// thresholds.ts
export const THRESHOLDS = { A_ABS: -4, A_REL: 6, L_MIN: 20, NOISE_FLOOR: 0.01, WIDESPREAD: 0.10, DARK_L: 25, TINT_B: 35, TINT_A: 20, ROI_FRACTION: 0.8 } as const;
```

- [ ] **Step 1: בדיקת snapshot נכשלת**

```ts
import { THRESHOLDS } from './thresholds';
test('ספים נעולים (שינוי מכוון דורש עדכון snapshot)', () => { expect(THRESHOLDS).toMatchInlineSnapshot(); });
```

- [ ] **Step 2: הרץ, ודא FAIL (המודול לא קיים).**
- [ ] **Step 3: צור את שני הקבצים לפי ה-Interfaces.**
- [ ] **Step 4: הרץ עם `-u` פעם אחת כדי לקבע את ה-snapshot, ואז בלי `-u`, ודא PASS.**
- [ ] **Step 5: Commit** `feat(core): analyzer types and thresholds`

---

### Task 4: המנתח המקומי

**Files:**
- Create: `src/core/analyzer/localGreenAnalyzer.ts`, `src/core/analyzer/testFrames.ts` (עזר לבדיקות: יצירת פריימים סינתטיים)
- Test: `src/core/analyzer/localGreenAnalyzer.test.ts`

**Interfaces:**
- Consumes: `rgbToLab`, `THRESHOLDS`, `Frame`, `AnalysisResult`, `Analyzer`.
- Produces: `export class LocalGreenAnalyzer implements Analyzer { analyze(frame: Frame): AnalysisResult }`, ו-`export function makeFrame(width: number, height: number, fill: (x: number, y: number) => [number, number, number]): Frame` ב-`testFrames.ts`.

- [ ] **Step 1: בדיקות נכשלות**

```ts
const BROWN: [number, number, number] = [190, 150, 100];
const GREEN: [number, number, number] = [110, 160, 70];
const a = new LocalGreenAnalyzer();
test('חום מלא: none', () => { const r = a.analyze(makeFrame(64, 64, () => BROWN)); expect(r.greenRatio).toBeLessThan(0.01); expect(r.lighting).toBe('ok'); });
test('ירוק מלא: widespread', () => { const r = a.analyze(makeFrame(64, 64, () => GREEN)); expect(r.greenRatio).toBeGreaterThan(0.10); });
test('כתם ירוק 10% בתוך ה-ROI: local', () => { const r = a.analyze(makeFrame(64, 64, (x, y) => (x >= 28 && x < 36 && y >= 20 && y < 44) ? GREEN : BROWN)); expect(r.greenRatio).toBeGreaterThan(0.01); expect(r.greenRatio).toBeLessThan(0.10); });
test('פיקסלים ירוקים מחוץ ל-ROI לא נספרים', () => { const r = a.analyze(makeFrame(64, 64, (x, y) => (x < 2 || y < 2) ? GREEN : BROWN)); expect(r.greenRatio).toBeLessThan(0.01); });
test('שחור: dark', () => { expect(a.analyze(makeFrame(16, 16, () => [5, 5, 5])).lighting).toBe('dark'); });
test('כתום רווי: tinted', () => { expect(a.analyze(makeFrame(16, 16, () => [255, 140, 0])).lighting).toBe('tinted'); });
test('לבן מלא: none, ok', () => { const r = a.analyze(makeFrame(16, 16, () => [250, 250, 250])); expect(r.greenRatio).toBe(0); expect(r.lighting).toBe('ok'); });
test('פיקסל אחד', () => { const r = a.analyze(makeFrame(1, 1, () => BROWN)); expect(r.mask.length).toBe(1); expect(Number.isFinite(r.greenRatio)).toBe(true); });
test('0x0 לא זורק', () => { const r = a.analyze({ width: 0, height: 0, data: new Uint8ClampedArray(0) }); expect(r.greenRatio).toBe(0); });
test('mask מסמן את הכתם', () => { const f = makeFrame(64, 64, (x, y) => (x >= 28 && x < 36 && y >= 20 && y < 44) ? GREEN : BROWN); const r = a.analyze(f); expect(r.mask[30 * 64 + 32]).toBe(1); expect(r.mask[30 * 64 + 5]).toBe(0); });
```

- [ ] **Step 2: הרץ, ודא FAIL.**

- [ ] **Step 3: ממש**

אלגוריתם (סעיף 4 באפיון): עבור כל פיקסל בתוך אליפסה מרכזית בחצאי צירים `ROI_FRACTION * width/2`, `ROI_FRACTION * height/2`: חשב Lab. אסוף a*, b*, L* לחציונים (חציון: מיון של מערך, או היסטוגרמה בשלמים; מותר O(n log n) ברוחב 256). `lighting`: `dark` אם חציון L* < DARK_L; אחרת `tinted` אם |חציון b*| > TINT_B או חציון a* > TINT_A; אחרת `ok`. פיקסל ירוק: `a < A_ABS && a < medianA - A_REL && L > L_MIN`. `greenRatio = green / roiPixels` (0 אם roiPixels = 0). `mask[y*width+x] = 1` לירוקים בתוך ה-ROI. 0x0: החזר `{greenRatio: 0, mask: new Uint8Array(0), lighting: 'dark'}`.
`// shortcut: no background segmentation, assumes potato fills the frame; upgrade when real-image calibration shows background false positives`

- [ ] **Step 4: הרץ, ודא PASS. `npm run lint:core`.**
- [ ] **Step 5: Commit** `feat(core): local green analyzer in cielab with relative threshold`

---

### Task 5: פסק דין ומצב סריקה

**Files:**
- Create: `src/core/verdict.ts`
- Test: `src/core/verdict.test.ts`

**Interfaces:**
- Consumes: `THRESHOLDS`, `Verdict`, `AnalysisResult`, `Frame`.
- Produces:
```ts
export function verdictFor(greenRatio: number): Verdict;
export const SEVERITY: Record<Verdict, number>; // none 0, local 1, widespread 2
export interface ScanSnapshot { worst: Verdict; worstRatio: number; worstFrame: Frame | null; worstMask: Uint8Array | null }
export class ScanState {
  readonly snapshot: ScanSnapshot;
  /** מחזיר true אם החומרה עלתה (ואז UI מקריא ומרטט) */
  update(result: AnalysisResult, frame: Frame): boolean;
  reset(): void;
}
```

- [ ] **Step 1: בדיקות נכשלות**

```ts
test('verdictFor', () => { expect(verdictFor(0)).toBe('none'); expect(verdictFor(0.0099)).toBe('none'); expect(verdictFor(0.01)).toBe('local'); expect(verdictFor(0.0999)).toBe('local'); expect(verdictFor(0.1)).toBe('widespread'); });
test('update שומר את החמור ביותר ומחזיר true רק בעלייה', () => {
  const s = new ScanState(); const f = { width: 1, height: 1, data: new Uint8ClampedArray(4) };
  expect(s.update({ greenRatio: 0.05, mask: new Uint8Array(1), lighting: 'ok' }, f)).toBe(true);
  expect(s.update({ greenRatio: 0.02, mask: new Uint8Array(1), lighting: 'ok' }, f)).toBe(false);
  expect(s.snapshot.worstRatio).toBe(0.05);
  expect(s.update({ greenRatio: 0.5, mask: new Uint8Array(1), lighting: 'ok' }, f)).toBe(true);
  expect(s.snapshot.worst).toBe('widespread');
});
test('תאורה לא תקינה לא מעדכנת', () => { const s = new ScanState(); expect(s.update({ greenRatio: 0.5, mask: new Uint8Array(1), lighting: 'dark' }, { width: 1, height: 1, data: new Uint8ClampedArray(4) })).toBe(false); expect(s.snapshot.worst).toBe('none'); });
test('reset', () => { const s = new ScanState(); s.update({ greenRatio: 0.5, mask: new Uint8Array(1), lighting: 'ok' }, { width: 1, height: 1, data: new Uint8ClampedArray(4) }); s.reset(); expect(s.snapshot.worst).toBe('none'); expect(s.snapshot.worstFrame).toBeNull(); });
```

- [ ] **Step 2: הרץ, ודא FAIL.**
- [ ] **Step 3: ממש.** `worstRatio` מתעדכן גם באותה רמה אם היחס גדול יותר (הפריים הגרוע ביותר), אבל `update` מחזיר true רק כשהרמה עולה.
- [ ] **Step 4: הרץ, ודא PASS. `npm run lint:core`.**
- [ ] **Step 5: Commit** `feat(core): verdict levels and scan state`

---

### Task 6: שכבת platform

**Files:**
- Create: `src/platform/camera.ts`, `src/platform/speech.ts`, `src/platform/haptics.ts`, `src/platform/storage.ts`, `src/platform/index.ts`
- Test: `src/platform/speech.test.ts`, `src/platform/haptics.test.ts`, `src/platform/storage.test.ts`

**Interfaces:**
- Consumes: `Frame`, `Verdict`.
- Produces:
```ts
// camera.ts
export interface Camera { start(video: HTMLVideoElement): Promise<void>; stop(): void; grabFrame(video: HTMLVideoElement, targetWidth: number): Frame | null; }
export class WebCamera implements Camera {} // getUserMedia {video:{facingMode:{ideal:'environment'}}}, canvas פנימי להקטנה; grabFrame מחזיר null אם video.videoWidth === 0
export async function frameFromFile(file: File, targetWidth: number): Promise<Frame>; // createImageBitmap, זורק Error('unsupported') אם נכשל
// speech.ts
export interface Speech { speak(text: string): void; hasHebrewVoice(): boolean; cancel(): void }
export class WebSpeech implements Speech {} // lang 'he-IL', rate 0.95; אם אין speechSynthesis: no-op
// haptics.ts
export const VIBRATION: Record<Verdict, number[]> = { none: [], local: [200], widespread: [200, 100, 200, 100, 200] };
export interface Haptics { vibrate(v: Verdict): void }
export class WebHaptics implements Haptics {} // navigator.vibrate אם קיים
// storage.ts
export interface Settings { speech: boolean; haptics: boolean }
export const DEFAULT_SETTINGS: Settings = { speech: true, haptics: true };
export function loadSettings(): Settings; export function saveSettings(s: Settings): void; // localStorage key 'solanisense.settings', JSON; שגיאה → DEFAULT_SETTINGS
// index.ts
export const platform = { camera: new WebCamera(), speech: new WebSpeech(), haptics: new WebHaptics() };
```

- [ ] **Step 1: בדיקות נכשלות**

```ts
// haptics.test.ts
test('דפוסי רטט לפי רמה', () => { expect(VIBRATION.none).toEqual([]); expect(VIBRATION.local).toEqual([200]); expect(VIBRATION.widespread).toEqual([200, 100, 200, 100, 200]); });
test('בלי navigator.vibrate לא זורק', () => { Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true }); expect(() => new WebHaptics().vibrate('widespread')).not.toThrow(); });
test('קורא ל-vibrate עם הדפוס', () => { const spy = vi.fn(); Object.defineProperty(navigator, 'vibrate', { value: spy, configurable: true }); new WebHaptics().vibrate('local'); expect(spy).toHaveBeenCalledWith([200]); });
// speech.test.ts
test('בלי speechSynthesis: hasHebrewVoice false, speak לא זורק', () => { (globalThis as any).speechSynthesis = undefined; const s = new WebSpeech(); expect(s.hasHebrewVoice()).toBe(false); expect(() => s.speak('שלום')).not.toThrow(); });
test('עם קול he-IL: true ו-speak עם lang he-IL', () => { const speak = vi.fn(); (globalThis as any).speechSynthesis = { getVoices: () => [{ lang: 'he-IL' }], speak, cancel: vi.fn() }; (globalThis as any).SpeechSynthesisUtterance = class { lang = ''; text = ''; rate = 1; constructor(t: string) { this.text = t; } }; const s = new WebSpeech(); expect(s.hasHebrewVoice()).toBe(true); s.speak('שלום'); expect(speak.mock.calls[0][0].lang).toBe('he-IL'); });
// storage.test.ts
test('ברירת מחדל כשאין כלום', () => { localStorage.clear(); expect(loadSettings()).toEqual({ speech: true, haptics: true }); });
test('שמירה וטעינה', () => { saveSettings({ speech: false, haptics: true }); expect(loadSettings()).toEqual({ speech: false, haptics: true }); });
test('JSON שבור → ברירת מחדל', () => { localStorage.setItem('solanisense.settings', '{bad'); expect(loadSettings()).toEqual(DEFAULT_SETTINGS); });
```

- [ ] **Step 2: הרץ, ודא FAIL.**
- [ ] **Step 3: ממש את ארבעת הקבצים.** `camera.ts` ללא בדיקת יחידה (תלוי ב-getUserMedia; מכוסה ב-E2E).
- [ ] **Step 4: הרץ, ודא PASS.**
- [ ] **Step 5: Commit** `feat(platform): web camera, speech, haptics, storage adapters`

---

### Task 7: מסך סריקה

**Files:**
- Create: `src/ui/screens/ScanScreen.tsx`, `src/ui/components/VerdictBanner.tsx`, `src/ui/components/Overlay.tsx`, `src/ui/components/Overlay.drawing.ts`, `src/ui/strings.ts`
- Test: `src/ui/components/VerdictBanner.test.tsx`, `src/ui/components/Overlay.drawing.test.ts`, `src/ui/screens/ScanScreen.test.tsx`

**Interfaces:**
- Consumes: `LocalGreenAnalyzer`, `ScanState`, `verdictFor`, `platform`, `frameFromFile`, `Settings`.
- Produces:
```ts
// strings.ts: כל מחרוזות ה-UI. בין השאר:
export const VERDICT_TEXT: Record<Verdict, { title: string; advice: string; speech: string }> = {
  none: { title: 'לא זוהה ירוק', advice: 'סובב לכל הצדדים. טעם מר או נבטים: לא לאכול.', speech: 'לא זוהה ירוק' },
  local: { title: 'הירקרקות מקומית', advice: 'קלף את האזור המסומן ואת העיניים בנדיבות, עד שלא נשאר ירוק ועוד שכבה. טעם מר: לא לאכול.', speech: 'זוהתה הירקרקות מקומית. קלף בנדיבות.' },
  widespread: { title: 'הירקרקות נרחבת', advice: 'לא לאכול.', speech: 'הירקרקות נרחבת. לא לאכול.' },
};
export const LIGHTING_TEXT = { dark: 'התאורה חלשה', tinted: 'התאורה צבעונית מדי, נסה ליד חלון' };
export const SCAN_HINT = 'מלא את המסגרת בתפוח האדמה וסובב אותו לאט לכל הצדדים';
// VerdictBanner.tsx
export function VerdictBanner(props: { verdict: Verdict; lighting: Lighting }): JSX.Element; // aria-live="assertive", צורה SVG לפי רמה (data-shape="check"|"triangle"|"x"), טקסט 40px
// Overlay.drawing.ts (טהור, נבדק ביחידה)
export function outlineOf(mask: Uint8Array, width: number, height: number): Uint8Array; // 1 לפיקסל ירוק שיש לו שכן 4-כיווני לא ירוק
export function drawOverlay(ctx: CanvasRenderingContext2D, mask: Uint8Array, width: number, height: number, scaleX: number, scaleY: number): void; // פסים אלכסוניים (כל 6px) בתוך mask, קו מתאר בעובי 3px; צבע לבן עם מסגרת שחורה (ניגודיות על כל רקע)
// ScanScreen.tsx
export function ScanScreen(props: { settings: Settings; onDone: (snap: ScanSnapshot) => void }): JSX.Element;
```

- [ ] **Step 1: בדיקות נכשלות**

```ts
// Overlay.drawing.test.ts
test('outline: ריבוע 4x4 בתוך 8x8 נותן 12 פיקסלי מתאר', () => { const m = new Uint8Array(64); for (let y = 2; y < 6; y++) for (let x = 2; x < 6; x++) m[y * 8 + x] = 1; const o = outlineOf(m, 8, 8); expect(Array.from(o).reduce((a, b) => a + b, 0)).toBe(12); });
test('outline של mask ריק ריק', () => { expect(Array.from(outlineOf(new Uint8Array(16), 4, 4)).every(v => v === 0)).toBe(true); });
// VerdictBanner.test.tsx
test.each([['none', 'לא זוהה ירוק', 'check'], ['local', 'הירקרקות מקומית', 'triangle'], ['widespread', 'הירקרקות נרחבת', 'x']] as const)('%s', (v, text, shape) => { render(<VerdictBanner verdict={v} lighting="ok" />); expect(screen.getByText(text)).toBeInTheDocument(); expect(document.querySelector(`[data-shape="${shape}"]`)).not.toBeNull(); expect(document.querySelector('[aria-live="assertive"]')).not.toBeNull(); });
test('תאורה חלשה מציגה הודעה', () => { render(<VerdictBanner verdict="none" lighting="dark" />); expect(screen.getByText('התאורה חלשה')).toBeInTheDocument(); });
test('אף מחרוזת לא מכילה "בטוח"', () => { expect(JSON.stringify(VERDICT_TEXT)).not.toContain('בטוח'); });
// ScanScreen.test.tsx (jsdom, getUserMedia ממוקק כנכשל)
test('בלי מצלמה: הסבר וכפתור העלאה', async () => { Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: () => Promise.reject(new Error('denied')) }, configurable: true }); render(<ScanScreen settings={DEFAULT_SETTINGS} onDone={() => {}} />); expect(await screen.findByText(/אין גישה למצלמה/)).toBeInTheDocument(); expect(screen.getByLabelText('העלה תמונה')).toBeInTheDocument(); });
test('קובץ לא נתמך: הודעה', async () => { vi.spyOn(cameraModule, 'frameFromFile').mockRejectedValue(new Error('unsupported')); render(<ScanScreen settings={DEFAULT_SETTINGS} onDone={() => {}} />); await userEvent.upload(screen.getByLabelText('העלה תמונה'), new File(['x'], 'a.heic', { type: 'image/heic' })); expect(await screen.findByText('הקובץ לא נתמך')).toBeInTheDocument(); }); // import * as cameraModule from '../../platform/camera'
```

- [ ] **Step 2: הרץ, ודא FAIL.**

- [ ] **Step 3: ממש**

`ScanScreen`: `useEffect` מפעיל `platform.camera.start(videoRef)`; על כישלון מצב `noCamera`. לולאה: `setInterval` 300ms, `grabFrame(video, 256)` → `analyzer.analyze` → `scanState.update`; אם החזיר true ו-`settings.speech` → `speech.speak(VERDICT_TEXT[v].speech)`, אם `settings.haptics` → `haptics.vibrate(v)`. `document.addEventListener('visibilitychange')`: כשמוסתר `clearInterval` ו-`camera.stop()`, כשחוזר מפעיל מחדש. ניקוי ב-unmount. `<video>` במלוא המסך, `<canvas>` Overlay מעליו באותו גודל. למעלה `VerdictBanner`, מתחתיו `SCAN_HINT`. למטה כפתור "סיימתי" (56px+) שקורא `onDone(scanState.snapshot)`, וכפתור משני `<label>` עם `<input type="file" accept="image/*" aria-label="העלה תמונה">` → `frameFromFile(file, 256)` → analyze → update → `onDone` מיד. כישלון → "הקובץ לא נתמך".
`// shortcut: setInterval instead of requestVideoFrameCallback, simpler and good enough at 300ms; upgrade if frame tearing is visible`

- [ ] **Step 4: הרץ, ודא PASS. ידנית: `npm run dev` על הטלפון או בדפדפן עם מצלמה, ודא שהסימון זז עם הווידאו.**
- [ ] **Step 5: Commit** `feat(ui): live scan screen with verdict banner and overlay`

---

### Task 8: מסך תוצאה

**Files:**
- Create: `src/ui/screens/ResultScreen.tsx`
- Modify: `src/ui/strings.ts`
- Test: `src/ui/screens/ResultScreen.test.tsx`

**Interfaces:**
- Consumes: `ScanSnapshot`, `VerdictBanner`, `drawOverlay`, `VERDICT_TEXT`.
- Produces: `export function ResultScreen(props: { snapshot: ScanSnapshot; onAgain: () => void }): JSX.Element;` ו-`export const CULTIVAR_WARNING = 'על קליפה אדומה או חומה מחוספסת הירוק עלול להיות מוסתר. טעם מר או נבטים הם סימני אזהרה גם בלי ירוק.'`

- [ ] **Step 1: בדיקות נכשלות**

```tsx
const snap = { worst: 'local' as const, worstRatio: 0.042, worstFrame: { width: 2, height: 2, data: new Uint8ClampedArray(16) }, worstMask: new Uint8Array(4) };
test('מציג פסק דין, אחוז, הנחיה ואזהרת זנים', () => { render(<ResultScreen snapshot={snap} onAgain={() => {}} />); expect(screen.getByText('הירקרקות מקומית')).toBeInTheDocument(); expect(screen.getByText('4%')).toBeInTheDocument(); expect(screen.getByText(VERDICT_TEXT.local.advice)).toBeInTheDocument(); expect(screen.getByText(CULTIVAR_WARNING)).toBeInTheDocument(); });
test('סרוק עוד אחד', async () => { const f = vi.fn(); render(<ResultScreen snapshot={snap} onAgain={f} />); await userEvent.click(screen.getByRole('button', { name: 'סרוק עוד אחד' })); expect(f).toHaveBeenCalled(); });
test('בלי פריים (לא נסרק כלום): מציג הנחיה לסרוק', () => { render(<ResultScreen snapshot={{ ...snap, worstFrame: null, worstMask: null, worst: 'none', worstRatio: 0 }} onAgain={() => {}} />); expect(screen.getByText('לא זוהה ירוק')).toBeInTheDocument(); });
```

- [ ] **Step 2: הרץ, ודא FAIL.**
- [ ] **Step 3: ממש.** הפריים מצויר ל-`<canvas>` דרך `putImageData` (ב-UI מותר) ואז `drawOverlay`. אחוז: `Math.round(worstRatio * 100) + '%'`.
- [ ] **Step 4: הרץ, ודא PASS.**
- [ ] **Step 5: Commit** `feat(ui): result screen`

---

### Task 9: מסך מידע עם אנימציית "איך מנקים"

**Files:**
- Create: `src/ui/screens/InfoScreen.tsx`, `src/ui/components/HowToAnimation.tsx`, `src/ui/content/info.ts`
- Test: `src/ui/screens/InfoScreen.test.tsx`

**Interfaces:**
- Consumes: `Settings`, `saveSettings`, `platform.speech`.
- Produces: `export function InfoScreen(props: { settings: Settings; onSettings: (s: Settings) => void }): JSX.Element;`
- `info.ts`: `export const INFO_SECTIONS: { title: string; body: string; source: string }[]` עם לפחות: מה זה סולנין (Oregon State), מתי מסוכן: ירוק, נבטים, מרירות (BfR, CFS), איך מאחסנים (CFS), איך מנקים (BfR, CFS, ספרות: 1.5 עד 3 מ"מ), בישול לא עוזר (CFS, Oregon State), ילדים רק קלוף (BfR). `export const DISCLAIMER: string` עם: מזהה ירוק בלבד, לא נבטים ולא רקב; תקף רק לתפוח אדמה שממלא את המסגרת; הספים הנדסיים, לא מאומתים רפואית; בספק: לא לאכול.
- `HowToAnimation.tsx`: SVG עם שלושה שלבים (קולפן על ירוק שטחי, סכין בזווית סביב עין, פח לזריקה), מעבר אוטומטי כל 4 שניות ב-CSS animation, כפתורים "הקודם"/"הבא", כפתור "הקרא" שמקריא את טקסט השלב. `prefers-reduced-motion`: בלי מעבר אוטומטי.

- [ ] **Step 1: בדיקות נכשלות**

```tsx
test('כל סעיף מציג מקור', () => { render(<InfoScreen settings={DEFAULT_SETTINGS} onSettings={() => {}} />); INFO_SECTIONS.forEach(s => { expect(screen.getByText(s.title)).toBeInTheDocument(); expect(screen.getAllByText(new RegExp(s.source)).length).toBeGreaterThan(0); }); });
test('הצהרת אחריות מוצגת', () => { render(<InfoScreen settings={DEFAULT_SETTINGS} onSettings={() => {}} />); expect(screen.getByText(/לא נבטים ולא רקב/)).toBeInTheDocument(); });
test('מתג הקראה', async () => { const f = vi.fn(); render(<InfoScreen settings={DEFAULT_SETTINGS} onSettings={f} />); await userEvent.click(screen.getByLabelText('הקראה קולית')); expect(f).toHaveBeenCalledWith({ speech: false, haptics: true }); });
test('אין קול עברי: הודעה', () => { (globalThis as any).speechSynthesis = { getVoices: () => [] }; render(<InfoScreen settings={DEFAULT_SETTINGS} onSettings={() => {}} />); expect(screen.getByText(/אין קול עברי/)).toBeInTheDocument(); });
test('אנימציה: שלושה שלבים וכפתור הבא', async () => { render(<HowToAnimation />); expect(screen.getByText(/שלב 1/)).toBeInTheDocument(); await userEvent.click(screen.getByRole('button', { name: 'הבא' })); expect(screen.getByText(/שלב 2/)).toBeInTheDocument(); });
test('אין "בטוח" בתוכן', () => { expect(JSON.stringify(INFO_SECTIONS) + DISCLAIMER).not.toContain('בטוח'); });
```

- [ ] **Step 2: הרץ, ודא FAIL.**
- [ ] **Step 3: ממש.** מתגים: `<input type="checkbox" role="switch" aria-label="הקראה קולית">` ו-`aria-label="רטט"`.
- [ ] **Step 4: הרץ, ודא PASS.**
- [ ] **Step 5: Commit** `feat(ui): info screen with sourced guidance and how-to animation`

---

### Task 10: ניווט, App, PWA

**Files:**
- Modify: `src/ui/App.tsx`, `src/main.tsx`, `vite.config.ts`, `index.html`
- Create: `src/ui/components/NavBar.tsx`, `public/icons/icon-192.png`, `public/icons/icon-512.png` (מהלוגו ב-`logo/solanisense_logo.jpeg`, חיתוך לריבוע)
- Test: `src/ui/App.test.tsx`

**Interfaces:**
- Consumes: `ScanScreen`, `ResultScreen`, `InfoScreen`, `loadSettings`, `saveSettings`.
- Produces: `App` עם מצב `screen: 'scan' | 'result' | 'info'`, `snapshot`, `settings`. `NavBar(props: { active: 'scan' | 'info'; onSelect: (s: 'scan' | 'info') => void })` עם שני כפתורים "סריקה" ו"מידע", 56px+, `aria-current="page"` לפעיל.

- [ ] **Step 1: בדיקות נכשלות**

```tsx
test('מתחיל בסריקה, עובר למידע וחזרה', async () => { render(<App />); expect(screen.getByRole('button', { name: 'סריקה' })).toHaveAttribute('aria-current', 'page'); await userEvent.click(screen.getByRole('button', { name: 'מידע' })); expect(screen.getByText(/הצהרת אחריות/)).toBeInTheDocument(); });
test('שורש RTL ועברית', () => { expect(document.documentElement.getAttribute('dir')).toBe('rtl'); expect(document.documentElement.getAttribute('lang')).toBe('he'); });
```

- [ ] **Step 2: הרץ, ודא FAIL.**
- [ ] **Step 3: ממש.** `vite-plugin-pwa` (בדוק רישיון) עם `manifest: { name: 'SolaniSense', short_name: 'SolaniSense', lang: 'he', dir: 'rtl', display: 'standalone', theme_color: '#1e3a5f', background_color: '#0f1f33', icons: [...] }`, `registerType: 'autoUpdate'`. בבדיקות: `main.tsx` לא נטען, ו-`App.test` מגדיר `document.documentElement.dir/lang` דרך `index.html` בלבד; אם jsdom לא קורא אותו, הוסף ב-`src/test-setup.ts` את אותן תכונות (ולא ב-App).
- [ ] **Step 4: הרץ, ודא PASS. `npm run build`, ודא `dist/manifest.webmanifest` ו-`sw.js` קיימים.**
- [ ] **Step 5: Commit** `feat: navigation, app shell, pwa manifest and service worker`

---

### Task 11: בדיקות קצה-לקצה

**Files:**
- Create: `playwright.config.ts`, `e2e/scan.spec.ts`, `e2e/fixtures/green-spot.png`, `e2e/fixtures/brown.png`, `scripts/make-fixtures.ts`
- Modify: `package.json` (`"test:e2e": "playwright test"`)

**Interfaces:**
- Consumes: האפליקציה הבנויה.

- [ ] **Step 1: התקן `@playwright/test` (בדוק רישיון, רשום) ו-`npx playwright install chromium`.**
- [ ] **Step 2: `scripts/make-fixtures.ts`**: מייצר שני PNG 256x256 עם `pngjs` או ה-canvas של Node (בדוק רישיון): `brown.png` חום אחיד `[190,150,100]`, `green-spot.png` חום עם מלבן ירוק `[110,160,70]` של 5% מהשטח במרכז. הרץ ושמור ל-`e2e/fixtures/`.
- [ ] **Step 3: בדיקות**

```ts
test('העלאת תמונה עם כתם: הירקרקות מקומית', async ({ page }) => { await page.goto('/'); await page.setInputFiles('input[type=file]', 'e2e/fixtures/green-spot.png'); await expect(page.getByText('הירקרקות מקומית')).toBeVisible(); await expect(page.locator('[aria-live="assertive"]')).toContainText('הירקרקות מקומית'); });
test('תמונה חומה: לא זוהה ירוק', async ({ page }) => { await page.goto('/'); await page.setInputFiles('input[type=file]', 'e2e/fixtures/brown.png'); await expect(page.getByText('לא זוהה ירוק')).toBeVisible(); });
test('RTL', async ({ page }) => { await page.goto('/'); await expect(page.locator('html')).toHaveAttribute('dir', 'rtl'); await expect(page.locator('html')).toHaveAttribute('lang', 'he'); });
test('מידע: מקורות והצהרה', async ({ page }) => { await page.goto('/'); await page.getByRole('button', { name: 'מידע' }).click(); await expect(page.getByText('BfR').first()).toBeVisible(); });
```
`playwright.config.ts`: `webServer: { command: 'npm run dev', port: 5173 }`, `use: { permissions: [] }` (ללא מצלמה, כך שמסלול ההעלאה נבדק).

- [ ] **Step 4: הרץ `npm run test:e2e`, ודא PASS.**
- [ ] **Step 5: Commit** `test: playwright e2e for upload path, rtl, info sources`

---

### Task 12: מטריצת תאורה

**Files:**
- Create: `test-images/README.md`, `test-images/expected.json`, `test-images/synthetic/*.png`, `scripts/make-lighting-matrix.ts`, `src/core/analyzer/lightingMatrix.test.ts`

**Interfaces:**
- Consumes: `LocalGreenAnalyzer`, `verdictFor`. ב-Node: `pngjs` לקריאת PNG ל-`Frame` (בבדיקה בלבד, לא ב-core).

- [ ] **Step 1: `scripts/make-lighting-matrix.ts`**: לכל תנאי (daylight, warm-2700k, cool-6500k, fluorescent, mixed, dim) מייצר שתי תמונות, `potato-clean` ו-`potato-green-spot` (כתם 5%): לוקח את הצבע הבסיסי החום והירוק ומכפיל בערוצי RGB לפי מקדם התאורה (warm: `[1.0, 0.85, 0.6]`, cool: `[0.8, 0.9, 1.0]`, fluorescent: `[0.9, 1.0, 0.85]`, dim: `[0.3, 0.3, 0.3]`, mixed: חצי שמאלי warm חצי ימני cool). שומר ל-`test-images/synthetic/<condition>-<kind>.png`.
- [ ] **Step 2: `expected.json`**: `{ "synthetic/daylight-potato-clean.png": "none", "synthetic/daylight-potato-green-spot.png": "local", ... , "synthetic/dim-potato-clean.png": "dark" }` (dim מצופה `lighting: 'dark'`).
- [ ] **Step 3: בדיקה**: טוענת כל קובץ ב-`expected.json`, מריצה את המנתח, ומשווה `verdictFor(greenRatio)` או `lighting` לצפוי. כישלון מדפיס את הקובץ, היחס, החציונים.
- [ ] **Step 4: הרץ. אם תנאי נכשל: כוון את `thresholds.ts` (ועדכן snapshot של משימה 3) עד שכל הסינתטיים עוברים. תעד ב-`test-images/README.md` כל שינוי סף והסיבה.**
- [ ] **Step 5: `test-images/README.md`**: הסבר למשתמש איך לצלם תמונות אמיתיות (6 תנאים × נקי/ירוק, תפוח אדמה ממלא את המסגרת, בלי פלאש), לאן לשים (`test-images/real/`), ואיך להוסיף ל-`expected.json`.
- [ ] **Step 6: Commit** `test: synthetic lighting matrix and calibration notes`

---

### Task 13: עיצוב UI עם Stitch

**Files:**
- Create: `docs/design/stitch-screens.md` (קישורים ל-Stitch, החלטות), `src/ui/theme.css` (משתני צבע וגופן)
- Modify: רכיבי `src/ui/**` (סגנון בלבד, לא לוגיקה)

**Interfaces:**
- Consumes: כל המסכים הקיימים.

- [ ] **Step 1: ב-Stitch (MCP)**: צור פרויקט "SolaniSense", מערכת עיצוב מהלוגו (כחול כהה `#0f1f33` רקע, `#1e3a5f` משני, כתום-חום של תפוח האדמה כהדגשה, לבן לטקסט), RTL, עברית, גופן Heebo או Assistant (Google Fonts, OFL). צור שלושה מסכים מטקסט: סריקה, תוצאה, מידע, לפי סעיף 2 באפיון, עם דגש: טקסט ענק, צורות ליד הפסק, כפתורים 56px+.
- [ ] **Step 2: הצג למשתמש את המסכים לאישור (widget עם תמונות או קישורים). אל תמשיך בלי אישור.**
- [ ] **Step 3: העתק את ה-Tailwind classes וה-SVG מהמסכים המאושרים לרכיבים. בלי שינוי לוגיקה, בלי שינוי מחרוזות.**
- [ ] **Step 4: הרץ `npm test` ו-`npm run test:e2e`, ודא PASS (העיצוב לא שבר דבר). בדוק ידנית ניגודיות 7:1 לטקסט הפסק (כלי: `npx @adobe/leonardo-contrast-colors` או בדיקה ידנית ב-DevTools).**
- [ ] **Step 5: Commit** `style: apply stitch design system to all screens`

---

### Task 14: סקירת אבטחה וסיום

**Files:**
- Create: `docs/security-review.md`
- Modify: `README.md`

- [ ] **Step 1: סקירה**: `npm audit` (אפס high/critical, או תיעוד למה לא ניתן לתקן). בדיקה ידנית: אין מידע נשלח לרשת (אפס `fetch`/`XMLHttpRequest` ב-`src`, חוץ מ-service worker של vite-plugin-pwa), תמונות לא נשמרות, `localStorage` מכיל רק הגדרות, אין `dangerouslySetInnerHTML`, CSP בסיסי ב-`index.html`: `default-src 'self'; img-src 'self' blob: data:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com`. תעד ב-`docs/security-review.md`.
- [ ] **Step 2: `README.md`** בעברית: מה האפליקציה, מה היא לא (הצהרת אחריות), הרצה, בדיקות, מבנה, קישור לאפיון ולמחקר, רישיונות.
- [ ] **Step 3: הרץ `npm test`, `npm run test:e2e`, `npm run build`. ודא PASS.**
- [ ] **Step 4: Commit** `docs: security review and readme` ו-`git push`.
