import { expect, type Locator, type Page, test } from '@playwright/test';
import { register } from './auth';

// Fenêtre des paramètres du lobby (LOB-5) : changer un réglage ne change que l'intérieur, la fenêtre ne bouge ni ne change de taille.

/** Le cadre visible de la fenêtre : la boîte du <dialog> reste en place même quand son contenu défile. */
const card = (page: Page) => page.getByRole('dialog').locator('> div');
const box = (locator: Locator) => locator.evaluate((el) => el.getBoundingClientRect().toJSON() as DOMRect);

async function openSettings(page: Page) {
  await register(page);
  await page.getByRole('button', { name: 'Create a new lobby' }).click();
  await page.waitForURL(/\/lobby\/[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('button', { name: 'Edit settings' }).click();
  return page.getByRole('dialog');
}

test('changing every setting never moves the dialog', async ({ page }) => {
  const dialog = await openSettings(page);
  const before = await box(card(page));

  // Dans l'ordre de la fenêtre : le corps défile au fil des clics, comme pour un vrai hôte.
  const changes: [string, () => Promise<void>][] = [
    ['language', () => dialog.getByRole('group', { name: 'Text language' }).locator('label').last().click()],
    ['content', () => dialog.getByRole('group', { name: 'Text type' }).getByRole('button', { name: 'Random words' }).click()],
    ['words', () => dialog.getByRole('button', { name: 'Increase Length (words)' }).click()],
    ['chars', () => dialog.getByRole('group', { name: 'Characters' }).locator('label').first().click()],
    ['practice', () => dialog.getByLabel('Characters to practise').fill(',./z')],
    ['timer', async () => {
      await dialog.getByRole('combobox', { name: 'Race timer' }).click();
      await dialog.getByRole('option').last().click();
    }],
    ['errors', () => dialog.getByRole('group', { name: 'Errors' }).getByRole('button', { name: 'Block until fixed' }).click()],
    ['bonus', () => dialog.getByText('Enable bonuses').click()],
    ['capacity', () => dialog.getByRole('button', { name: 'Increase Capacity' }).click()],
    ['access', () => dialog.getByRole('group', { name: 'Access' }).getByRole('button', { name: 'Public' }).click()],
  ];
  for (const [name, change] of changes) {
    await change();
    expect(await box(card(page)), name).toEqual(before);
  }
});
