import { expect, test } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  const locator = page.locator("#numberOfEntries");
  await expect(locator).toHaveText("4999", {timeout: Number.POSITIVE_INFINITY})
});

// test('get started link', async ({ page }) => {
//   await page.goto('https://playwright.dev/');

//   // Click the get started link.
//   await page.getByRole('link', { name: 'Get started' }).click();

//   // Expects page to have a heading with the name of Installation.
//   await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
// });
