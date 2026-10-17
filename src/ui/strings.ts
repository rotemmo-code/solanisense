import type { Verdict } from '../core/analyzer/types';

// Every UI string, in Hebrew. None calls a potato safe and none names a solanine level (spec section 1).
export const VERDICT_TEXT: Record<Verdict, { title: string; advice: string; speech: string }> = {
  none: { title: 'לא זוהה ירוק', advice: 'סובב לכל הצדדים. טעם מר או נבטים: לא לאכול.', speech: 'לא זוהה ירוק' },
  local: { title: 'הירקרקות מקומית', advice: 'קלף את האזור המסומן ואת העיניים בנדיבות, עד שלא נשאר ירוק ועוד שכבה. טעם מר: לא לאכול.', speech: 'זוהתה הירקרקות מקומית. קלף בנדיבות.' },
  widespread: { title: 'הירקרקות נרחבת', advice: 'לא לאכול.', speech: 'הירקרקות נרחבת. לא לאכול.' },
};
export const LIGHTING_TEXT = { dark: 'התאורה חלשה', tinted: 'התאורה צבעונית מדי, נסה ליד חלון' };
export const SCAN_HINT = 'מלא את המסגרת בתפוח האדמה וסובב אותו לאט לכל הצדדים';
export const SCAN_TEXT = {
  start: 'התחל סריקה',
  done: 'סיימתי',
  upload: 'העלה תמונה',
  noCamera: 'אין גישה למצלמה. אפשר לאשר גישה בהגדרות הדפדפן, או להעלות תמונה של תפוח האדמה.',
  unsupported: 'הקובץ לא נתמך',
};
export const CULTIVAR_WARNING = 'על קליפה אדומה או חומה מחוספסת הירוק עלול להיות מוסתר. טעם מר או נבטים הם סימני אזהרה גם בלי ירוק.';
export const NOTHING_ANALYZED = 'לא נסרק דבר. נסה שוב באור טוב יותר, ומלא את המסגרת בתפוח האדמה.';
// percent follows a separate "4%" element; image is the start of the picture's screen-reader label
export const RESULT_TEXT = { again: 'סרוק עוד אחד', percent: 'מהשטח בתמונה ירוק', image: 'התמונה שנסרקה' };
