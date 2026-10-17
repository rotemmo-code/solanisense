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

## תלויות עקיפות מחוץ לרשימה המותרת

נסרק מ-`package-lock.json` ב-2026-10-17. כולן כלי פיתוח ובדיקה בלבד. הקוד שנשלח לדפדפן מכיל רק react, react-dom ו-scheduler (MIT).

| חבילה | גרסה | רישיון | מגיעה דרך |
|---|---|---|---|
| lightningcss (וקבצי הבינארי שלה לכל פלטפורמה) | 1.33.0, 1.32.0 | MPL-2.0 | vite 8 ו-@tailwindcss/node (תלות חובה, כלי build) |
| @csstools/color-helpers, @csstools/css-syntax-patches-for-csstree | 6.1.2, 1.1.15 | MIT-0 | jsdom |
| lru-cache | 11.5.3 | BlueOak-1.0.0 | jsdom |
| mdn-data | 2.27.1 | CC0-1.0 | jsdom (דרך css-tree) |

MPL-2.0 אינו ברשימה המותרת. אי אפשר להימנע ממנו עם Vite 8 ו-Tailwind 4. ההחלטה אם לקבל אותו כתלות build היא של בעל הפרויקט.
