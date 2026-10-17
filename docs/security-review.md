# סקירת אבטחה ופרטיות: SolaniSense, שלב 1

- תאריך: 2026-10-17.
- מה נסקר: `main` ב-commit `9d7ace514b368b3802ec6836f074ed7371dea74c`, ועליו מדיניות ה-CSP ב-`index.html`, שנוספה בקומיט של הסקירה הזו (`bc22442`) ותוקנה בסבב התיקון הראשון. הקוד זהה ל-`b09770b`: הקומיט `9d7ace5` הוסיף רק את `docs/decisions.md`.
- סביבה: Windows 11, Node 24.19.0, npm 11.17.0, Vite 8.3.4, vite-plugin-pwa 2.0.0, ודפדפן Chrome Headless Shell של Playwright 1.64.1.
- היקף: הקוד ב-`src`, `index.html`, הבנייה ב-`dist`, התלויות והתמונות שבריפו. השינוי היחיד בקוד הוא תג ה-CSP. ממצאים שדורשים שינוי קוד רשומים בסעיף 5, ולא בוצעו. שני ממצאים שלא דרשו שינוי ב-`src` בוצעו בסבב התיקון הראשון (סעיף 5, פריטים 1 ו-5).

## סיכום

| בדיקה | תוצאה |
|---|---|
| CSP ב-`index.html` | נוסף. הבנייה לייצור ושרת הפיתוח עובדים תחתיו: 6 מתוך 6 בדיקות קצה-לקצה בכל אחד, אפס הפרות, ובבנייה לייצור אפס שגיאות CSP בקונסול. `frame-ancestors` לא בתג: הוא חייב להגיע ככותרת HTTP מהאירוח (סעיף 1.3) |
| `npm audit --omit=dev` | 0 פגיעויות |
| `npm audit` | 0 פגיעויות |
| קריאות רשת ב-`src` | אין |
| הזרקת HTML או קוד ב-`src` | אין |
| `localStorage` | מפתח אחד, `solanisense.settings`, עם שני ערכים בוליאניים |
| שמירת תמונות | אין |
| כיבוי המצלמה | ביציאה מהמסך, ב"סיימתי" ובטאב מוסתר. 8 בדיקות מכסות את זה |
| קבצים שמועלים | מפוענחים רק ב-`createImageBitmap` |
| ה-precache של ה-service worker | 5 קבצים, כולם מהבנייה של האפליקציה |
| סקריפטים של צד שלישי | אין סקריפט שנטען מבחוץ. בבנייה: react, react-dom, scheduler ו-workbox, כולם MIT |
| רישיונות | כל 20 התלויות ב-`package.json` רשומות ב-`docs/licenses.md`. workbox-strategies, שהייתה חסרה ברשימת הקוד שנשלח לדפדפן, נוספה בסבב התיקון (סעיף 3.9) |
| מטא-דאטה בתמונות שבריפו | אין: 19 תמונות, בלי EXIF ובלי מיקום |
| סודות בריפו | אין |

## 1. מדיניות CSP

### 1.1 המדיניות

ב-`index.html`, מיד אחרי `<meta charset>` ולפני כל משאב:

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' blob: data:; media-src 'self' blob:; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'
```

| הנחיה | למה |
|---|---|
| `script-src 'self'` | רק הקבצים של האפליקציה. בלי סקריפט מוטמע בדף, בלי `eval` ובלי `new Function` |
| `connect-src 'self'` | גם אם קוד עתידי ינסה לשלוח משהו החוצה, הדפדפן יחסום |
| `style-src` עם `'unsafe-inline'` | שרת הפיתוח של Vite מזריק את ה-CSS כתגי `<style>`. בבנייה לייצור ה-CSS הוא קובץ חיצוני. לא נבדק אם הבנייה לייצור עובדת גם בלי `'unsafe-inline'` |
| `https://fonts.googleapis.com`, `https://fonts.gstatic.com` | לגופן Rubik שמתוכנן בשלב העיצוב (משימה 13). היום שום דבר לא נטען משם (סעיף 3.8). ראה סעיף 5 |
| `img-src` עם `blob:` ו-`data:`, `media-src` עם `blob:` | האפליקציה לא משתמשת בהם היום: המצלמה מחוברת לווידאו דרך `srcObject`, לא דרך כתובת. נשארו לפי ההחלטה |
| `worker-src 'self'`, `manifest-src 'self'` | ה-service worker (`/sw.js`) וה-manifest מאותו מקור |
| `object-src 'none'`, `base-uri 'self'`, `form-action 'none'` | אין plugins, אין `<base>` ואין טפסים באפליקציה |
| `frame-ancestors` | לא בתג: בתג meta הדפדפן מתעלם ממנו. חייב להגיע ככותרת HTTP מהאירוח. סעיף 1.3 |

### 1.2 אימות

1. `npm run build`, ואז קריאת `dist/index.html`: תג ה-CSP במקומו. הדף טוען רק את `/assets/index-<hash>.js` (מודול), את `/assets/index-<hash>.css` ואת `/manifest.webmanifest`, כולם מאותו מקור. אין סקריפט מוטמע.
2. הבנייה לייצור: `npx vite preview --port 5173 --strictPort` ברקע, ואז `npm run test:e2e`. ב-`playwright.config.ts` מוגדר `reuseExistingServer: true`, ולכן הבדיקות רצו מול הבנייה. תוצאה: `6 passed`.
3. בדיקה חד-פעמית ב-Playwright מול הבנייה (סקריפט מקומי, לא נשמר בריפו). היא טוענת את הדף, מעלה את `e2e/fixtures/green-spot.png`, עוברת למסך המידע, טוענת מחדש, וטוענת שוב בלי רשת. התוצאות מההרצה החוזרת בסבב התיקון, עם המדיניות הסופית:
   - תוכן תג ה-CSP בדף זהה בדיוק למחרוזת למעלה.
   - ה-service worker נרשם: `http://localhost:5173/sw.js`.
   - ההעלאה מציגה "הירקרקות מקומית", ומסך המידע נטען.
   - בלי רשת (`context.setOffline(true)` וטעינה מחדש) האפליקציה נטענת מה-service worker, ותג ה-CSP בתוכה.
   - אפס אירועי `securitypolicyviolation`, אפס שגיאות JavaScript.
   - 19 בקשות רשת, כולן ל-`http://localhost:5173`.
   - 0 violations, 0 CSP console errors: הקונסול ריק לגמרי בזרימה הרגילה. לפני הסרת `frame-ancestors` מהתג, Chrome הדפיס בכל טעינה, ברמת error: `The Content Security Policy directive 'frame-ancestors' is ignored when delivered via a <meta> element.`
4. בדיקות נגד, שמראות שהמדיניות נאכפת. הכתובות בסיומת `.invalid`, שלא קיימת אף פעם, כך ששום בקשה לא יצאה מהמחשב:
   - סקריפט מוטמע שנוסף לדף: לא רץ (הפרה של `script-src-elem`).
   - `eval` ו-`new Function` מקוד הדף: `EvalError` (הפרה של `script-src`). `page.evaluate` של Playwright מתיר `eval` כברירת מחדל (הפרמטר `allowUnsafeEvalBlockedByCSP` של CDP), ולכן הבדיקה מריצה אותם מתוך `setTimeout` של הדף.
   - `fetch` לכתובת חיצונית: נחסם (הפרה של `connect-src`) ונדחה ב-`TypeError`.
   - תמונה וסקריפט מכתובת חיצונית: נחסמו (`img-src`, `script-src-elem`), והבקשות נכשלו בסיבה `csp`.
5. שרת הפיתוח: `npm run dev` ברקע, ואז `npm run test:e2e`: `6 passed`. אותה בדיקה חד-פעמית מול שרת הפיתוח: אפס הפרות, אפס שגיאות JavaScript, אפס בקשות לכתובות אחרות, ה-WebSocket של Vite התחבר (`[vite] connected.`), ובדיקות הנגד נחסמו כמו בבנייה. הבדיקה הזו רצה לפני הסרת `frame-ancestors` מהתג. ההנחיה לא נאכפה בתג גם אז, ולכן האכיפה זהה. בדיקות הקצה-לקצה רצו שוב מול שרת הפיתוח אחרי ההסרה. עדכון חם בפועל, כלומר שינוי קובץ בזמן ריצה, לא נבדק, כי המשימה לא משנה קבצים ב-`src`.

### 1.3 מה המדיניות לא עושה

- **`frame-ancestors` חייב להגיע ככותרת HTTP מהאירוח, ולכן הוא לא בתג.** בתג meta הדפדפן מתעלם מההנחיה הזו ומדפיס שגיאה בקונסול בכל טעינה, ולכן היא הוסרה מהתג בסבב התיקון. עד שהאירוח ישלח אותה, כל אתר יכול להטמיע את האפליקציה ב-`iframe`. הסיכון נמוך: אין חשבונות ואין פעולה רגישה, ומצלמה בתוך `iframe` של אתר אחר דורשת הרשאה מפורשת מהדף המטמיע (`allow="camera"`). הפתרון הוא לשלוח את ה-CSP, כולל `frame-ancestors 'none'`, ככותרת HTTP מהשרת שיארח את האפליקציה. יש שירותי אירוח, למשל GitHub Pages, שלא מאפשרים כותרות משלך.
- **שרת הפיתוח עובד תחת המדיניות בזכות סדר ההזרקה.** Vite מזריק את `/@vite/client`, ו-`@vitejs/plugin-react` את הסקריפט המוטמע של React Refresh, בראש ה-`<head>`, לפני תג ה-CSP. מדיניות בתג meta חלה רק על מה שמגיע אחריה, ולכן הסקריפט רץ. אם גרסה עתידית של Vite תזריק אחרי התג, שרת הפיתוח יישבר, ויהיה צריך `'unsafe-inline'` ב-`script-src` בפיתוח בלבד. היום זה לא נדרש.
- **המדיניות לא חלה על ה-service worker.** ל-service worker יש מדיניות משלו, מכותרות ה-HTTP של `sw.js`, ותג ה-meta בדף לא חל עליו. הוא מביא רק את קבצי ה-precache, מאותו מקור (סעיף 3.7).
- **המדיניות לא חלה על מנוע ההקראה של הדפדפן.** סעיף 4.

## 2. npm audit

| פקודה | תוצאה |
|---|---|
| `npm audit --omit=dev` | `found 0 vulnerabilities`, קוד יציאה 0 |
| `npm audit` | `found 0 vulnerabilities`, קוד יציאה 0 |

לפי `npm audit --json`: ‏524 חבילות, מהן 4 של ייצור (`metadata.dependencies.prod`). אין ממצאים בתלויות הייצור ואין ממצאים בתלויות הפיתוח, ולכן לא נדרש תיקון, ו-`package.json` ו-`package-lock.json` לא השתנו. התוצאה נכונה למאגר הפגיעויות של npm ב-2026-10-17. כדאי להריץ שוב לפני כל שחרור.

## 3. בדיקות ידניות

כל הפקודות רצו מתיקיית הריפו ב-Git Bash. grep שלא מוצא כלום יוצא בקוד 1.

### 3.1 אין קריאות רשת

```
grep -rnE "\bfetch\b|XMLHttpRequest|WebSocket|sendBeacon|EventSource" src
```

תוצאה: אין התאמות. בבנייה, הבדיקה בסעיף 1.2 ספרה 19 בקשות, כולן לשרת המקומי. כתובות מלאות שמופיעות בקבצי הבנייה, ואף אחת מהן לא נטענת:

```
grep -ohE "(https?|wss?)://[A-Za-z0-9._~:/?#@!$&'()*+,;=%-]+" dist/index.html dist/sw.js dist/workbox-*.js dist/assets/*.js dist/assets/*.css dist/manifest.webmanifest
```

- `http://www.w3.org/...` (SVG, MathML, XLink, XML): מזהי namespace בתוך React DOM.
- `https://react.dev/errors/`: הקישור בהודעות השגיאה המקוצרות של React.
- `https://bit.ly/wb-precache`: קישור בהודעת אזהרה של workbox.
- `https://tailwindcss.com`: הערת הרישיון בראש קובץ ה-CSS.
- `https://fonts.googleapis.com`, `https://fonts.gstatic.com`: בתוך תג ה-CSP עצמו.

### 3.2 אין הזרקת HTML או קוד

```
grep -rnE "dangerouslySetInnerHTML|innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\b|new Function" src
```

תוצאה: אין התאמות. כל הטקסט מוצג דרך React כטקסט ולא כ-HTML, ואין באפליקציה שדה טקסט: הקלט היחיד של המשתמש הוא קובץ ושני מתגים. ה-CSP חוסם `eval` ו-`new Function` (סעיף 1.2).

### 3.3 `localStorage`: מפתח אחד, שני ערכים בוליאניים

```
grep -rnE "localStorage|sessionStorage" src
grep -rnE "'solanisense\.[a-z]+'" src
grep -rnE "document\.cookie|postMessage|window\.open|target=|href=|<a |<iframe|<form|<object|<embed" src index.html
```

תוצאה: בקוד האפליקציה `localStorage` מופיע רק ב-`src/platform/storage.ts` (שורות 7 ו-14), עם המפתח היחיד `solanisense.settings` (שורה 3). שאר ההופעות בבדיקות (`storage.test.ts`, `App.test.tsx`). אין `sessionStorage` ואין עוגיות. הערך הוא `{ speech: boolean, haptics: boolean }`. `loadSettings` לוקח רק את שני השדות, ורק כשהם בוליאניים. JSON שבור או צורה אחרת מחזירים את ברירת המחדל (`storage.test.ts`, שורות 7, 10 ו-11). החיפוש השלישי מצא רק את שני קישורי האייקון ב-`index.html`, מאותו מקור.

### 3.4 תמונות לא נשמרות

```
grep -rnE "toDataURL|toBlob|indexedDB|IndexedDB|caches\.|createObjectURL|FileReader|readAs(Text|DataURL|ArrayBuffer)|\.text\(\)|\.arrayBuffer\(\)" src
```

תוצאה: אין התאמות. פריים מהמצלמה או מקובץ נמצא רק בזיכרון, ב-`ScanState` ובמצב של React. הפריים של התוצאה האחרונה נשאר בזיכרון של `App` עד הסריקה הבאה או עד שהדף נסגר, ולא נכתב לשום מקום. ה-service worker שומר רק את קבצי הבנייה (סעיף 3.7).

### 3.5 המצלמה נכבית

נקראו `src/platform/camera.ts` ו-`src/ui/screens/ScanScreen.tsx`:

- `getUserMedia` מבקש וידאו בלבד, עם `audio: false` (`camera.ts:27`). אין מיקרופון.
- `stop()` עוצר את כל ה-tracks ומנקה את `srcObject` (`camera.ts:43`).
- אם `stop()` נקרא בזמן שחלון ההרשאה פתוח, הזרם שמגיע אחר כך נעצר מיד (`camera.ts:29`). `play()` שנכשל מכבה את המצלמה (`camera.ts:38`).
- ב-`ScanScreen` ה-effect של הסריקה עוצר את המצלמה ואת לולאת הניתוח ביציאה מהמסך ובכל יציאה מ-`scanning` (`ScanScreen.tsx:59`), כולל "סיימתי" (שורה 68). טאב מוסתר עוצר אותן, וחזרה לטאב מפעילה מחדש (שורה 56).
- בדיקות: `camera.test.ts` שורות 42, 53, 66; `ScanScreen.test.tsx` שורות 76, 84, 94, 111; `App.test.tsx` שורה 18.

### 3.6 קובץ שמועלה מפוענח כתמונה בלבד

```
grep -rn "createImageBitmap" src --include=*.ts --include=*.tsx | grep -v '\.test\.'
```

תוצאה: רק `src/platform/camera.ts:61`, בתוך `frameFromFile`. הקובץ לא נקרא כטקסט ולא הופך לכתובת (סעיף 3.4). `accept="image/*"` הוא רק רמז לבורר הקבצים, ולכן הבדיקה בפועל היא הפענוח: קובץ שאינו תמונה נדחה ב-`createImageBitmap`, והמסך מציג "הקובץ לא נתמך" (בדיקת הקצה-לקצה "קובץ פגום"). ה-`ImageBitmap` נסגר ב-`finally`.

### 3.7 ה-precache של ה-service worker

```
npm run build && cat dist/sw.js
```

תוצאה: `precacheAndRoute` עם 5 רשומות: `index.html`, `assets/index-<hash>.js`, `assets/index-<hash>.css`, `assets/workbox-window.prod.es5-<hash>.js`, `manifest.webmanifest`. יש ניתוב אחד: ניווט מוגש מ-`index.html`. אין שמירה בזמן ריצה, ולכן שום דבר אחר לא נכנס למטמון. האייקונים לא ב-precache (`includeManifestIcons: false`). ה-runtime של workbox נטען מקובץ מקומי, `workbox-<hash>.js`.

### 3.8 סקריפטים של צד שלישי

- `dist/index.html` טוען רק קבצים מאותו מקור (סעיף 1.2). אין CDN, אין אנליטיקס ואין גופן חיצוני.
- מה נכנס לבנייה, לפי ה-sourcemaps של בנייה זמנית מחוץ לריפו (`npx vite build --sourcemap --outDir <תיקייה זמנית>`): בדף react, react-dom ו-scheduler, ו-workbox-window בקובץ נפרד שנטען בהרשמת ה-service worker. ב-service worker: workbox-core, workbox-precaching, workbox-routing ו-workbox-strategies. כולן ברישיון MIT, ו-workbox בגרסה 7.4.1.

### 3.9 רישיונות

סקריפט חד-פעמי השווה את `dependencies` ו-`devDependencies` ב-`package.json` לטבלה "תלויות ישירות" ב-`docs/licenses.md`, ואת הגרסה והרישיון בטבלה ל-`node_modules/<pkg>/package.json`.

תוצאה: 20 מתוך 20 רשומות, והגרסה והרישיון תואמים בכולן. השורה הנוספת בטבלה, `@testing-library/dom`, היא peer שהותקן אוטומטית ומתועדת ככזו. פער אחד, שתוקן בסבב התיקון: המשפט על הקוד שנשלח לדפדפן מנה את workbox-core, workbox-precaching ו-workbox-routing, וחסרה בו workbox-strategies (‏MIT, ‏7.4.1). עכשיו היא שם, עם הגרסה והרישיון.

### 3.10 הריפו הציבורי

```
git grep -nIiE "api[_-]?key|secret|passw(or)?d|bearer|token\b|private[_-]?key|BEGIN [A-Z ]*PRIVATE" -- . ':!package-lock.json'
```

תוצאה: אין התאמות.

מטא-דאטה בתמונות: סקריפט חד-פעמי קרא את כל 19 קבצי ה-JPEG וה-PNG שב-`git ls-files`. בשני קבצי ה-JPEG (`logo/`, `buildin_model/`) אין מקטע EXIF. בקבצי ה-PNG אין chunks של טקסט, זמן או EXIF (`tEXt`, `iTXt`, `zTXt`, `tIME`, `eXIf`). ההוראה להסיר מיקום מתמונות אמיתיות שיתווספו ל-`test-images/real/` כבר נמצאת ב-`test-images/README.md`.

## 4. הערות איום

**מה האפליקציה עושה עם מידע.** אחרי הביקור הראשון האפליקציה עובדת בלי רשת, והקוד שלה לא שולח כלום. הניתוח רץ במכשיר, ב-`src/core`, ואין בקוד שום קריאת רשת (סעיף 3.1). ה-CSP חוסם גם קריאה עתידית בטעות (`connect-src 'self'`). הפריימים מהמצלמה ומקבצים נמצאים בזיכרון בלבד. המידע היחיד שנשמר במכשיר הוא שני ערכים בוליאניים: הקראה ורטט. ה-service worker שומר רק את קבצי האפליקציה. ההרשאה היחידה שהאפליקציה מבקשת היא מצלמה, בלי מיקרופון.

**הקראה.** האפליקציה לא בוחרת קול. היא קובעת `lang = 'he-IL'`, והדפדפן בוחר. יש דפדפנים שמציעים קולות רשת (`SpeechSynthesisVoice.localService === false`). אם נבחר קול כזה, הדפדפן שולח לספק הקול את הטקסט המוקרא: פסק הדין, או שלב מ"איך מנקים". אלה מחרוזות קבועות, בלי תמונה ובלי מידע אישי, אבל זו יציאה לרשת שלא עוברת דרך הקוד שלנו. הצעה בסעיף 5.

**סיכונים שנשארו:**

א. **"לא זוהה ירוק" על תפוח אדמה רעיל.** פריים שסווג כחשוך או כצבעוני לא נשפט בכלל, ולכן הסיכון הוא בתאורה שעוברת את שער התאורה ועדיין מטעה, כמו אור חם קיצוני, ועל קליפה אדומה או חומה מחוספסת. בשני המקרים הירוק עלול לא להיראות גם כשהרעלן עלה. גם נבטים וטעם מר לא נבדקים. קוד לא יפתור את זה. ההגנה היא בניסוח ובהצהרת האחריות: האפליקציה אומרת "לא זוהה ירוק" ואף פעם לא "בטוח", ההנחיה לרמה הזו היא "סובב לכל הצדדים. טעם מר או נבטים: לא לאכול.", אזהרת הזנים מופיעה בכל מסך תוצאה, והצהרת האחריות במסך המידע. כיול על תמונות אמיתיות עוד לא נעשה (`test-images/README.md`).

ב. **ה-service worker עלול לטעון את הדף מחדש באמצע סריקה.** עם `registerType: 'autoUpdate'`, ה-service worker החדש מדלג על ההמתנה ותופס שליטה (`skipWaiting` ו-`clientsClaim` ב-`dist/sw.js`), ו-`registerSW` קורא ל-`window.location.reload()` כשהוא מופעל כעדכון. אחרי שמתפרסמת גרסה חדשה, משתמש שפותח את האפליקציה ומתחיל לסרוק מיד עלול לאבד את הסריקה, כולל פסק הדין. אין כאן דליפת מידע. הסיכון כבר מסומן בקוד (`src/main.tsx`, הערת `shortcut:`). הצעה בסעיף 5.

ג. **שרת הפיתוח לא מוקשח.** `npm run dev` ו-`vite preview` מאזינים רק ל-`localhost`, כפי שהפלט שלהם אומר: `Network: use --host to expose`. עם `--host` הם חשופים לכל מי שברשת: שרת הפיתוח מגיש את קבצי המקור ואת ה-WebSocket של העדכון החם. לבדיקה בטלפון עדיפה העברת פורט ב-USB אל `localhost` (ב-Android דרך `chrome://inspect`). לא להריץ עם `--host` ברשת לא מוכרת. לאירוח מעלים רק את `dist/`.

ד. **הטמעה ב-`iframe`.** סעיף 1.3.

ה. **קובץ ענק.** `createImageBitmap` מקבל את התמונה בגודלה המלא, וההקטנה לרוחב 256 באה אחר כך. תמונה גדולה מאוד עלולה למלא את הזיכרון ולהפיל את הלשונית. ההשפעה מוגבלת ללשונית של המשתמש, שבחר את הקובץ בעצמו. לא נבדק.

## 5. ממצאים והצעות שלא בוצעו

1. **`frame-ancestors`.** בוצע בסבב התיקון: ההנחיה הוסרה מתג ה-meta, שבו לא אכפה כלום והדפיסה שגיאה בקונסול בכל טעינה. נשאר לשלוח את כל המדיניות, כולל `frame-ancestors 'none'`, ככותרת `Content-Security-Policy` מהאירוח כשייבחר. באותו מקום כדאי גם `X-Content-Type-Options: nosniff` ו-`Permissions-Policy: camera=(self), microphone=()`.
2. **Google Fonts.** טעינת Rubik מ-Google תגרום לכל משתמש לשלוח בקשה לשרתי Google, עם כתובת ה-IP שלו, בניגוד לכך שהאפליקציה לא שולחת כלום. בנוסף הגופן לא יהיה זמין בלי רשת, כי ה-precache כולל רק את קבצי הבנייה. ההצעה: לארוז את Rubik (רישיון OFL) עם הבנייה, ולמחוק את `https://fonts.googleapis.com` ואת `https://fonts.gstatic.com` מה-CSP.
3. **עדכון ה-service worker.** ההצעה: ב-`vite.config.ts` להחליף ל-`registerType: 'prompt'`, וב-`src/main.tsx` לשמור את מה ש-`registerSW` מחזיר (`const updateSW = registerSW({ immediate: true, onNeedRefresh })`), כש-`onNeedRefresh` מציג הודעה "יש גרסה חדשה" עם כפתור שקורא ל-`updateSW(true)`. זה דורש רכיב UI, ולכן לא בוצע: ה-UI מוקפא.
4. **קול מקומי להקראה.** ההצעה, ב-`src/platform/speech.ts`, בתוך `speak()` אחרי `u.lang = 'he-IL'`:

   ```ts
   u.voice = s.getVoices().find(v => /^(he|iw)([-_]|$)/i.test(v.lang) && v.localService) ?? null;
   ```

   כך קול עברי מקומי, אם יש כזה, קודם לקול רשת. כשאין קול מקומי ההתנהגות לא משתנה.
5. **`docs/licenses.md`, שורה 50.** בוצע בסבב התיקון: workbox-strategies נוספה למשפט על ה-service worker, עם הגרסה והרישיון.
6. **`'unsafe-inline'` ב-`style-src`.** כשה-CSP יישלח ככותרת לבנייה לייצור בלבד, כדאי לבדוק אם אפשר להוריד אותו שם.
7. **Tailwind סורק גם את המסמכים.** בלי `source()`, התוסף של Tailwind ל-Vite סורק את כל הקבצים בריפו, כולל `README.md` ו-`docs/`, ומילה במסמך שהיא גם שם של מחלקת Tailwind נכנסת ל-CSS שנשלח לדפדפן. בטיוטה של הסקירה הזו מילה אחת כזו הוסיפה כלל CSS אחד, והנוסח שונה. אין לזה השפעה על המראה, אבל שינוי במסמכים משנה את קבצי הבנייה. ההצעה, ב-`src/index.css`: `@import "tailwindcss" source(".");`, שמגביל את הסריקה ל-`src/`. לא נבדק.
