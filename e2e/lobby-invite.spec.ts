import { expect, type Locator, type Page, test } from '@playwright/test';
import { register } from './auth';

// Carte et fenêtre d'invitation (LOB-3, LOB-4) : seul l'hôte partage un lien, et rien ne bouge ni ne change de taille
// quand on crée ou supprime des liens ou qu'on change l'accès du lobby.

const card = (page: Page) => page.getByRole('heading', { name: 'Invite exorcists' }).locator('xpath=../..');
const settings = (page: Page) => page.locator('section[aria-labelledby="settings-title"]');

/** Position et taille dans la page (pas dans la fenêtre) : un clic qui fait défiler ne compte pas comme un déplacement. */
const box = (locator: Locator) =>
  locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
  });

/** Ouvre un lobby neuf depuis l'accueil : un compte neuf en est l'hôte (un invité ne peut pas héberger). */
async function createLobby(page: Page) {
  await register(page);
  await page.getByRole('button', { name: 'Create a new lobby' }).click();
  await page.waitForURL(/\/lobby\/[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  await page.evaluate(() => document.fonts.ready);
}

test.beforeEach(async ({ context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
});

test('the host creates, copies and deletes one-time links without the window moving or resizing', async ({ page }) => {
  await createLobby(page);
  await page.getByRole('button', { name: 'Invite links' }).click();
  const dialog = page.getByRole('dialog', { name: 'Invite links' });
  const rows = dialog.getByRole('list', { name: 'Links' }).getByRole('listitem');
  await expect(dialog.getByText('No links yet.')).toBeVisible();
  const before = await box(dialog);

  await dialog.getByRole('button', { name: 'New invite link' }).click();
  await expect(rows).toHaveCount(1);
  await expect(rows.first().getByText(/\?invite=[\w-]{22}$/)).toBeVisible();
  expect(await box(dialog)).toEqual(before);

  await dialog.getByRole('spinbutton', { name: 'Batch' }).fill('12');
  await dialog.getByRole('spinbutton', { name: 'Batch' }).press('Enter');
  await dialog.getByRole('button', { name: 'Create 12 links' }).click();
  await expect(rows).toHaveCount(13);
  await expect(dialog.getByText('13 / 30 links')).toBeVisible();
  expect(await box(dialog)).toEqual(before);

  await rows.first().getByRole('button', { name: 'Delete link' }).click();
  await expect(rows).toHaveCount(12);
  expect(await box(dialog)).toEqual(before);

  // Les liens sont en base : rouvrir la fenêtre après un rechargement les retrouve.
  await page.reload();
  await page.getByRole('button', { name: 'Invite links' }).click();
  await expect(rows).toHaveCount(12);
});

test('the host of a public lobby gets the lobby address', async ({ page }) => {
  await createLobby(page);
  await page.getByRole('button', { name: 'Edit settings' }).click();
  await page.getByRole('dialog').getByRole('group', { name: 'Access' }).getByRole('button', { name: 'Public' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();

  await page.getByRole('button', { name: 'Invite links' }).click();
  await expect(page.getByLabel('Lobby link')).toHaveValue(/\/lobby\/[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  await expect(page.getByRole('button', { name: 'New invite link' })).toHaveCount(0);
});

test('changing the lobby access moves nothing', async ({ page }) => {
  await createLobby(page);
  const cardBefore = await box(card(page));
  const settingsBefore = await box(settings(page));

  for (const access of ['Public', 'Code', 'Private', 'Public']) {
    await page.getByRole('button', { name: 'Edit settings' }).click();
    await page.getByRole('dialog').getByRole('group', { name: 'Access' }).getByRole('button', { name: access }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(settings(page).getByRole('definition').getByText(access, { exact: true })).toBeVisible();
    expect(await box(card(page)), access).toEqual(cardBefore);
    expect(await box(settings(page)), access).toEqual(settingsBefore);
  }
});

test('adding a bot does not push the settings down', async ({ page, isMobile }) => {
  test.skip(isMobile, 'on one column the settings sit under the participant list, which grows with each bot');
  await createLobby(page);
  const before = await box(settings(page));

  await page.getByRole('button', { name: 'Add a bot' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'joined the lobby' })).toBeVisible();
  expect((await box(settings(page))).y).toBe(before.y);
});

test('a player who is not the host gets no link', async ({ page }) => {
  await page.goto('/lobby/SHJ-60S');

  await expect(page.getByRole('button', { name: 'Copy code' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Invite links' })).toBeDisabled();
  await expect(page.getByText('Only the host can share an invite link.')).toBeVisible();
});
