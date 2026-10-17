# SolaniSense

אפליקציית PWA לזיהוי הירקרקות בתפוחי אדמה, לעיוורי צבעים. עברית ו-RTL בלבד.

## מסמכים
- אפיון: docs/superpowers/specs/2026-10-17-solanisense-design.md
- מחקר: docs/research/2026-10-17-greening-research.md
- מודל הפיתוח: buildin_model/building_model.jpeg

## כללים
- `src/core/` הוא TypeScript טהור: בלי DOM, בלי React, בלי Web API. בדיקות יחידה חובה.
- `src/platform/` הוא ממשק + מימוש. UI לא קורא ל-Web API ישירות.
- אף מידע לא מועבר בצבע בלבד. כל פסק דין: טקסט, צורה, הקראה, רטט.
- האפליקציה לא אומרת "בטוח" ולא מציגה "רמת סולנין". ירוק הוא סימן אזהרה.
- ספי הזיהוי רק ב-`src/core/analyzer/thresholds.ts`.
- `dir="rtl"` ו-`lang="he"` על השורש. מחרוזות בעברית בלבד.
- אחרי כל שינוי: `npm test`, `npm run test:e2e`, סקירת אבטחה, commit.
- לכל קיצור דרך מכוון: הערה בפורמט `shortcut: <המגבלה>, <מתי לשדרג>`.

## פקודות
- `npm run dev`, `npm run build`, `npm test`, `npm run test:e2e`
