import { expect, test } from '@playwright/test';
import { register } from './auth';

// Une course finie est enregistrée par la room (STAT-8) : le profil du compte montre ensuite ses statistiques (STAT-1, STAT-2).

test.skip(({ isMobile }) => isMobile, 'typing a whole race: the desktop run covers it');
test.describe.configure({ timeout: 90_000 });

test('a finished race is saved and shows on the player profile', async ({ page }) => {
  const { username } = await register(page, 'race');
  await page.getByRole('button', { name: 'Create a new lobby' }).click();
  await page.waitForURL(/\/lobby\/[A-Z0-9]{3}-[A-Z0-9]{3}$/);

  // Texte le plus court : 10 mots.
  await page.getByRole('button', { name: 'Edit settings' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/^Length \(words\)/).fill('10');
  await dialog.getByLabel(/^Length \(words\)/).press('Tab');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden();

  // Il faut au moins deux participants : un bot, jamais enregistré (BOT-5).
  await page.getByRole('button', { name: 'Add a bot' }).click();
  await page.getByRole('button', { name: 'Start the race' }).click();
  await page.waitForURL(/\/race$/);

  const field = page.getByLabel('Type the text');
  await expect(field).toBeAttached();
  const text = (await page.locator('p.sr-only:has(+ div[aria-hidden="true"])').textContent())!;
  // Après le décompte ; une frappe toutes les 80 ms reste sous la vitesse plausible d'un humain (RACE-14).
  await page.waitForTimeout(5500);
  await field.focus();
  await field.pressSequentially(text, { delay: 80 });
  // La course finit quand le bot arrive aussi.
  await expect(page.getByRole('link', { name: 'Back to the lobby' })).toBeVisible({ timeout: 60_000 });

  await page.goto(`/profile/${username}`);
  await expect(page.getByText(/^1 races · [01] wins · best: \d+ WPM$/)).toBeVisible();
  await expect(page.getByRole('region', { name: 'Main statistics' })).toBeVisible();
});
