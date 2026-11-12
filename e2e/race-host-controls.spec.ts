import { expect, type Page, test } from '@playwright/test';
import { register } from './auth';

// Écran des résultats d'un lobby créé (COURSE-11) : l'hôte relance la course (retour au salon d'attente) ou ferme le salon.
// Écrit sans avoir été lancé : il demande PostgreSQL.

test.skip(({ isMobile }) => isMobile, 'typing a whole race: the desktop run covers it');
test.describe.configure({ timeout: 120_000 });

/** Lance une course de 10 mots contre un bot, sans capacités, et la tape jusqu'au bout. */
async function raceToResults(page: Page) {
  await page.getByRole('button', { name: 'Start the race' }).click();
  await page.waitForURL(/\/race$/);
  const field = page.getByLabel('Type the text');
  await expect(field).toBeAttached();
  const text = (await page.locator('p.sr-only:has(+ div[aria-hidden="true"])').textContent())!;
  await page.waitForTimeout(5500);
  await field.focus();
  await field.pressSequentially(text, { delay: 80 });
  await expect(page.getByRole('button', { name: 'Restart the race' })).toBeVisible({ timeout: 5000 });
}

test('the host restarts the race, then closes the lobby', async ({ page }) => {
  await register(page, 'host');
  await page.getByRole('button', { name: 'Create a new lobby' }).click();
  await page.waitForURL(/\/lobby\/[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  const lobbyUrl = page.url();

  await page.getByRole('button', { name: 'Edit settings' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/^Length \(words\)/).fill('10');
  await dialog.getByLabel(/^Length \(words\)/).press('Tab');
  await dialog.getByRole('combobox', { name: 'Game mode' }).click();
  await dialog.getByRole('option', { name: 'Heavenly Restricted' }).click();
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Add a bot' }).click();

  // Relance : retour au salon d'attente, même bot, réglages modifiables.
  await raceToResults(page);
  await page.getByRole('button', { name: 'Restart the race' }).click();
  await page.waitForURL(lobbyUrl);
  await expect(page.getByText('Cursed corpse 1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit settings' })).toBeEnabled();

  // Fermeture : confirmée, puis la liste des lobbies le dit.
  await raceToResults(page);
  await page.getByRole('button', { name: 'Close the lobby' }).click();
  await page.getByRole('dialog', { name: 'Close the lobby?' }).getByRole('button', { name: 'Close the lobby' }).click();
  await page.waitForURL(/\/lobbies\?closed=1$/);
  await expect(page.getByRole('status').filter({ hasText: 'The lobby was closed.' })).toBeVisible();

  await page.goto(lobbyUrl);
  await expect(page.getByRole('heading', { name: "This lobby doesn't exist" })).toBeVisible();
});
