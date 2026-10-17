# רישיונות

רישיונות מותרים: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD. כל חבילה נבדקת לפני ההתקנה עם `npm view <pkg> license`.

## תלויות ישירות

| חבילה | גרסה | רישיון | סוג |
|---|---|---|---|
| react | 19.3.1 | MIT | dependencies |
| react-dom | 19.3.1 | MIT | dependencies |
| @tailwindcss/vite | 4.3.3 | MIT | devDependencies |
| @testing-library/jest-dom | 7.0.1 | MIT | devDependencies |
| @testing-library/react | 16.3.3 | MIT | devDependencies |
| @testing-library/user-event | 14.6.7 | MIT | devDependencies |
| @testing-library/dom | 10.4.2 | MIT | peer של @testing-library/react, הותקן אוטומטית |
| @types/node | 24.19.2 | MIT | devDependencies |
| @types/react | 19.3.0 | MIT | devDependencies |
| @types/react-dom | 19.3.0 | MIT | devDependencies |
| @vitejs/plugin-react | 6.1.2 | MIT | devDependencies |
| jsdom | 30.1.3 | MIT | devDependencies |
| tailwindcss | 4.3.3 | MIT | devDependencies |
| typescript | 7.0.2 | Apache-2.0 | devDependencies |
| vite | 8.3.4 | MIT | devDependencies |
| vitest | 5.0.5 | MIT | devDependencies |
| vite-plugin-pwa | 2.0.0 | MIT | devDependencies |

התלויות העיקריות של vite-plugin-pwa הן workbox-build ו-workbox-window, גרסה 7.4.1, MIT.

## תלויות עקיפות מחוץ לרשימה המותרת

נסרק מ-`package-lock.json` ב-2026-10-17. כולן כלי פיתוח ובדיקה בלבד. הקוד שנשלח לדפדפן מכיל רק react, react-dom, scheduler ו-workbox (MIT): הדף טוען את workbox-window, וה-service worker בנוי מ-workbox-core, workbox-precaching ו-workbox-routing.

| חבילה | גרסה | רישיון | מגיעה דרך |
|---|---|---|---|
| lightningcss (וקבצי הבינארי שלה לכל פלטפורמה) | 1.33.0, 1.32.0 | MPL-2.0 | vite 8 ו-@tailwindcss/node (תלות חובה, כלי build) |
| @csstools/color-helpers, @csstools/css-syntax-patches-for-csstree | 6.1.2, 1.1.15 | MIT-0 | jsdom |
| lru-cache | 11.5.3 | BlueOak-1.0.0 | jsdom |
| mdn-data | 2.27.1 | CC0-1.0 | jsdom (דרך css-tree) |
| glob, jackspeak, minimatch, minipass, path-scurry, package-json-from-dist, @isaacs/cliui | 11.1.0, 4.2.3, 10.2.6, 7.1.3, 2.0.2, 1.0.1, 9.0.0 | BlueOak-1.0.0 | vite-plugin-pwa דרך workbox-build (כלי build) |
| caniuse-lite | 1.0.30001816 | CC-BY-4.0 | vite-plugin-pwa דרך workbox-build, @babel/core ו-browserslist (כלי build) |

MPL-2.0 אינו ברשימה המותרת. אי אפשר להימנע ממנו עם Vite 8 ו-Tailwind 4. ההחלטה אם לקבל אותו כתלות build היא של בעל הפרויקט.

גם BlueOak-1.0.0 ו-CC-BY-4.0 מחוץ לרשימה. החדשים מגיעים רק דרך workbox-build, כלי ה-build של vite-plugin-pwa, ולא נשלחים לדפדפן. כדי להימנע מהם צריך לוותר על vite-plugin-pwa ולכתוב service worker ו-manifest ידנית. גם זו החלטה של בעל הפרויקט.

type-fest 0.16.0 (דרך workbox-build ו-tempy) ברישיון כפול MIT OR CC0-1.0, ולכן חל עליו MIT.

## נבדקו ולא הותקנו

| חבילה | גרסה | רישיון | למה לא |
|---|---|---|---|
| sharp | 0.35.5 | Apache-2.0, אבל הבינארי ל-Windows (@img/sharp-win32-x64) הוא Apache-2.0 AND LGPL-3.0-or-later | נשקלה ליצירת אייקוני ה-PWA. האייקונים נוצרו במקומה עם System.Drawing של Windows (scripts/make-icons.ps1), בלי תלות חדשה. |
