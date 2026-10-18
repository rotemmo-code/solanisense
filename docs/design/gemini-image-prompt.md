# פרומפט ל-Gemini: תמונות ריאליסטיות של SolaniSense

העתק את הפרומפט באנגלית (מודלי תמונה מבינים אותו טוב יותר). בקש תמונה אחת בכל פנייה, והחלף את החלק "SCREEN" בכל פעם. הטקסט בעברית על המסך צריך להיכתב בדיוק כפי שהוא כאן; אם המודל משבש אותיות עבריות, בקש "render the Hebrew text exactly as given, right-to-left" או השאר את המסך ללא טקסט ותוסיף אותו בעריכה.

## פרומפט בסיס (אנגלית)

```
Photorealistic product shot of a smartphone held in a hand in a home kitchen, soft daylight from a window, shallow depth of field. On the phone screen is a Hebrew, right-to-left mobile app called "SolaniSense": dark navy background (#0f1f33), card surfaces in deep blue (#1e3a5f), white Rubik-style text, a warm tan primary button (#d9a05b) with dark text, light-blue outlined secondary buttons, rounded 16px corners, a bottom navigation bar with two items: "סריקה" (camera icon) and "מידע" (info icon). Calm, clinical, trustworthy look. No gradients, no glow.

Accessibility rule shown on screen: every verdict has very large text and a white shape icon on its right (check in a circle, warning triangle, or X). Marked areas on images are white outlines with diagonal white stripes, never a color fill.

SCREEN: <paste one of the three blocks below>

Output: 1170x2532 portrait, ultra sharp UI, realistic phone bezel, real kitchen counter in the background with a raw potato next to the phone.
```

## מסך 1: סריקה חיה

```
SCREEN: Live camera view filling the middle of the screen, showing a real brown potato on a wooden counter through the camera. A dashed white ellipse guide with a thin black halo is drawn over the video. At the top, a card with a white check-in-circle icon on the right and the huge Hebrew text "לא זוהה ירוק", with a smaller gray line "סובב לאט את תפוח האדמה לכל הצדדים". Below the video: a full-width tan button "סיימתי" and an outlined button "העלה תמונה" with an upload icon. Bottom nav: "סריקה" highlighted in tan, "מידע" in white.
```

## מסך 2: תוצאה

```
SCREEN: A frozen photo of a potato with one green patch near its edge; the patch is outlined in a thick white line with a black halo and filled with diagonal white stripes. Above it, a card with a white warning-triangle icon on the right and the huge Hebrew text "הירקרקות מקומית", with the line "6% מהשטח בתמונה ירוק". Below the photo, an advice card with a small knife icon on the right: "קלף את האזור המסומן ואת העיניים בנדיבות, עד שלא נשאר ירוק ועוד שכבה. טעם מר: לא לאכול." and a muted source line "מקורות: BfR, CFS הונג קונג, Oregon State". Then a full-width tan button "סרוק עוד אחד". Bottom nav with "סריקה" highlighted.
```

## מסך 3: מידע

```
SCREEN: Title "מידע". A settings card with two rows, labels on the right and tan toggle switches on the left: "הקראה קולית" and "רטט". A card titled "איך מנקים, שלב אחר שלב" with a flat illustration of a potato with a striped green patch and a vegetable peeler, caption "שלב 1: קולפן לירוק השטחי", and three small text buttons "הקודם", "הקרא", "הבא". Below, an info card: title "מה זה סולנין", two lines of Hebrew body text, and a muted source line "מקור: Oregon State". Bottom nav with "מידע" highlighted in tan.
```

## טיפים
- אם הטקסט העברי יוצא משובש: בקש "no text on screen, leave empty text boxes" ושים את הטקסט בעצמך.
- לגרסה "אפליקציה בלבד בלי יד": החלף את המשפט הראשון ב-"Clean UI render of a smartphone screen, straight on, no hand, plain dark background".
- לשמור על עקביות בין שלוש התמונות: בקש "same phone, same lighting, same kitchen as the previous image".
