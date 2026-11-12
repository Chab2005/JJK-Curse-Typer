import { expect, test } from '@playwright/test';
import { register } from './auth';

// Historique des courses (HIST-01).
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
