import { expect, test } from '@playwright/test';
import { register } from './auth';

// Historique des courses (HIST-01) et page de résultats d'une course passée (HIST-02).
// Écrit sans avoir été lancé : il demande PostgreSQL.

test('a signed-out visitor is sent to the login page', async ({ page }) => {
  await page.goto('/history');
  await page.waitForURL(/\/login$/);
});

test('a new account sees an empty history, linked from its profile', async ({ page }) => {
  const { username } = await register(page, 'hist');
  await page.goto(`/profile/${username}`);
  await page.getByRole('link', { name: 'Race history' }).click();
  await page.waitForURL(/\/history$/);
  await expect(page.getByText('No race yet. Join a lobby and finish a race: it will show up here.')).toBeVisible();
});

test.describe('after a race', () => {
  test.skip(({ isMobile }) => isMobile, 'typing a whole race: the desktop run covers it');
  test.describe.configure({ timeout: 90_000 });

  test('the race shows in the history and reopens its full results; another account gets a 404', async ({ page, browser }) => {
    await register(page, 'hist');
    await page.getByRole('button', { name: 'Create a new lobby' }).click();
    await page.waitForURL(/\/lobby\/[A-Z0-9]{3}-[A-Z0-9]{3}$/);
    await page.getByRole('button', { name: 'Edit settings' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/^Length \(words\)/).fill('10');
    await dialog.getByLabel(/^Length \(words\)/).press('Tab');
    await dialog.getByRole('combobox', { name: 'Game mode' }).click();
    await dialog.getByRole('option', { name: 'Heavenly Restricted' }).click();
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole('button', { name: 'Add a bot' }).click();
    await page.getByRole('button', { name: 'Start the race' }).click();
    await page.waitForURL(/\/race$/);

    const field = page.getByLabel('Type the text');
    await expect(field).toBeAttached();
    const text = (await page.locator('p.sr-only:has(+ div[aria-hidden="true"])').textContent())!;
    await page.waitForTimeout(5500);
    await field.focus();
    await field.pressSequentially(text, { delay: 80 });
    await expect(page.getByRole('button', { name: 'Restart the race' })).toBeVisible({ timeout: 5000 });

    await page.goto('/history');
    const table = page.getByRole('table', { name: 'Your races' });
    await expect(table.getByRole('row')).toHaveCount(2);
    await expect(table).toContainText('2 players');
    await table.getByRole('link', { name: /^See the results of the race of/ }).click();
    await page.waitForURL(/\/history\/\d+$/);
    const url = page.url();

    // Page de résultats complète, bot compris (RES-01 à RES-03).
    await expect(page.getByRole('region', { name: 'Race podium' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Results' }).getByRole('row')).toHaveCount(3);
    await expect(page.getByText('Cursed corpse 1').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'WPM over time' })).toBeVisible();

    // Un autre compte n'ouvre pas la course : 404.
    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await register(otherPage, 'peek');
    await otherPage.goto(new URL(url).pathname);
    await expect(otherPage.getByRole('heading', { name: "This race isn't in your history" })).toBeVisible();
    await other.close();
  });
});
