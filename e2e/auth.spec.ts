import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { register } from './auth';

// Comptes et invités (AUTH-1 à AUTH-8, PROF-3, PROF-5). Les comptes créés ici restent en base de développement.


test('registers, logs out, logs back in, and rejects a wrong password', async ({ page }) => {
  const { username, password } = await register(page);
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();

  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('link', { name: 'Log in' }).first()).toBeVisible();

  await page.goto('/login');
  await page.getByLabel(/^Username/).fill(username.toUpperCase());
  await page.getByLabel(/^Password/).fill('not-the-password');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Wrong username or password.' })).toBeVisible();

  await page.getByLabel(/^Password/).fill(password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.waitForURL('/');
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
});

test('refuses a taken username, whatever its case', async ({ page, context }) => {
  const { username } = await register(page);
  await context.clearCookies();

  await page.goto('/register');
  await page.getByLabel(/^Username/).fill(username.toUpperCase());
  await page.getByLabel(/^Password/).fill('another-password');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'already taken' })).toBeVisible();
});

test('keeps the login name and shows the display name on the profile (PROF-3)', async ({ page }) => {
  const { username } = await register(page);
  await page.goto('/settings');
  await page.getByLabel('Display name').fill('Gojo の Satoru');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible();

  await page.goto('/profile');
  await expect(page).toHaveURL(new RegExp(`/profile/${username}$`));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gojo の Satoru');
  await expect(page.getByText(`@${username}`)).toBeVisible();
});

test('uploads a profile picture (PROF-5) and rejects other file types and sizes', async ({ page }) => {
  const { username } = await register(page);
  await page.goto('/settings');

  await page.getByLabel('Choose a picture').setInputFiles({ name: 'a.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a......') });
  await page.getByRole('button', { name: 'Upload' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Only JPEG, PNG or WebP' })).toBeVisible();

  await page.getByLabel('Choose a picture').setInputFiles({ name: 'big.png', mimeType: 'image/png', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) });
  await expect(page.getByRole('alert').filter({ hasText: '2 MB or less' })).toBeVisible();

  await page.getByLabel('Choose a picture').setInputFiles({ name: 'ok.png', mimeType: 'image/png', buffer: await sharp({ create: { width: 600, height: 300, channels: 3, background: '#c33' } }).png().toBuffer() });
  await page.getByRole('button', { name: 'Upload' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible();

  const res = await page.request.get(`/api/avatar/${username}`);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toBe('image/webp');
  // Recadrée en carré et redimensionnée avant d'être stockée.
  const meta = await sharp(await res.body()).metadata();
  expect([meta.width, meta.height]).toEqual([256, 256]);
});

test('a guest needs a 3 to 20 character name to join and cannot host', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/PIN/).fill('ABC-234');
  await page.getByLabel('Exorcist name').fill('ab');
  await page.getByRole('button', { name: 'Expand the domain' }).click();
  await expect(page.getByRole('alert').filter({ hasText: '3 to 20' })).toBeVisible();
  await expect(page).toHaveURL('/');

  await page.getByRole('button', { name: 'Log in to create a lobby' }).click();
  await page.waitForURL('/login');
});

test('settings and profile need an account', async ({ page }) => {
  await page.goto('/settings');
  await expect(page).toHaveURL('/login');
  await page.goto('/profile');
  await expect(page).toHaveURL('/login');
});
