import { expect, test } from '@playwright/test';

test('העלאת תמונה עם כתם: הירקרקות מקומית', async ({ page }) => {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles('e2e/fixtures/green-spot.png');
  await expect(page.getByText('הירקרקות מקומית')).toBeVisible();
  await expect(page.locator('[aria-live="assertive"]')).toContainText('הירקרקות מקומית');
  await expect(page.getByText('מקורות: BfR, CFS הונג קונג, Oregon State')).toBeVisible(); // fix wave: the advice names its sources
});
test('תמונה חומה: לא זוהה ירוק', async ({ page }) => {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles('e2e/fixtures/brown.png');
  await expect(page.getByText('לא זוהה ירוק')).toBeVisible();
});
test('RTL', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'he');
});
test('מידע: מקורות והצהרה', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'מידע' }).click();
  await expect(page.getByText('BfR').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'הצהרת אחריות' })).toBeVisible(); // the title promises the disclaimer too
});

// Added: the speech switch in a real browser, and a broken file through the real decoder (the unit tests mock both)
test('מידע: מתג הקראה קולית מתחלף', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'מידע' }).click();
  const speech = page.getByRole('switch', { name: 'הקראה קולית' });
  await expect(speech).toBeChecked(); // on by default
  await speech.click();
  await expect(speech).not.toBeChecked();
  await speech.click();
  await expect(speech).toBeChecked();
});
test('קובץ פגום: הקובץ לא נתמך', async ({ page }) => {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('not a png') });
  await expect(page.getByRole('alert')).toHaveText('הקובץ לא נתמך');
  await expect(page.getByRole('button', { name: 'התחל סריקה' })).toBeVisible(); // still on the scan screen
});
