import { expect, test, type Page } from '@playwright/test';
import { register } from './auth';

// Une vraie course : la fenêtre de lancement reçoit les touches sans que le champ de frappe perde le focus (BON-*).

test.skip(({ isMobile }) => isMobile, 'shortcuts need a keyboard');
test.describe.configure({ timeout: 90_000 });

const INCANTATION = 'With this treasure, I summon...  Eight-Handled Sword Divergent Sila Divine General Mahoraga';

/** Salon en énergie illimitée, Megumi choisi, un bot : la course part, décompte compris. */
async function startRace(page: Page, timer?: string) {
  await register(page, 'cast');
  await page.getByRole('button', { name: 'Create a new lobby' }).click();
  await page.waitForURL(/\/lobby\/[A-Z0-9]{3}-[A-Z0-9]{3}$/);

  await page.getByRole('button', { name: 'Edit settings' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox', { name: 'Game mode' }).click();
  await dialog.getByRole('option', { name: 'Unlimited CE' }).click();
  if (timer) {
    await dialog.getByRole('combobox', { name: 'Race timer' }).click();
    await dialog.getByRole('option', { name: timer }).click();
  }
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: 'Megumi Fushiguro' }).click();
  await page.getByRole('button', { name: 'Add a bot' }).click();
  await page.getByRole('button', { name: 'Start the race' }).click();
  await page.waitForURL(/\/race$/);

  const field = page.getByLabel('Type the text');
  await expect(field).toBeAttached();
  await expect(page.getByRole('button', { name: /Technique/ })).toBeEnabled({ timeout: 10_000 });
  await expect(field).toBeFocused();
  return field;
}

test('casts by typing the name, without ever leaving the text field', async ({ page }, testInfo) => {
  const field = await startRace(page);
  const modal = page.getByRole('dialog', { name: 'Type your ability' });
  const caret = page.locator('[data-caret]');

  await page.keyboard.press('Alt+w');
  await expect(modal).toBeVisible();
  await expect(field).toBeFocused();
  await page.keyboard.press('Escape');
  await page.mouse.click(40, 40);
  await expect(modal).toBeVisible();
  await expect(field).toBeFocused();

  // Deux fautes pardonnées, puis le nom.
  await page.keyboard.type('zqR');
  await expect(page.getByTestId('cast-line')).toHaveText('Rabbit Escape');
  await page.keyboard.type('o');
  await expect(page.getByTestId('cast-line')).toHaveText('Round Deer');
  await page.screenshot({ path: testInfo.outputPath('cast-dialog.png') });
  await page.keyboard.type('und Deer');
  await expect(modal).toBeHidden();
  await expect(field).toBeFocused();
  await expect(page.getByText('Ward ready')).toBeVisible();

  // Le texte repart sans recliquer.
  const first = await caret.textContent();
  await page.keyboard.type(first!);
  await expect(caret).not.toHaveText(first!);

  // Une faute après la grâce ferme la fenêtre.
  await page.keyboard.press('Alt+w');
  await expect(modal).toBeVisible();
  await page.keyboard.type('Toax');
  await expect(modal).toBeHidden();
  await expect(page.getByText('Cast failed: wrong name')).toBeVisible();
  await expect(field).toBeFocused();
});

test('summons Mahoraga with the whole incantation', async ({ page }, testInfo) => {
  await startRace(page);
  await page.keyboard.press('Alt+w');
  await page.keyboard.type(INCANTATION, { delay: 5 });

  await expect(page.getByRole('heading', { name: 'Mahoraga takes your place' })).toBeVisible();
  await expect(page.getByText('Mahoraga', { exact: false }).first()).toBeVisible();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: testInfo.outputPath('mahoraga.png') });
});

test('opens a domain', async ({ page }, testInfo) => {
  await startRace(page);
  await page.keyboard.press('Alt+q');
  await page.keyboard.type('Chimera Shadow Garden');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('Domain open')).toBeVisible();
  const backdrop = page.getByTestId('race-domain');
  await expect(backdrop).toBeVisible();
  const viewport = page.viewportSize()!;
  expect(await backdrop.boundingBox()).toEqual({ x: 0, y: 0, width: viewport.width, height: viewport.height });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: testInfo.outputPath('domain.png') });
  await page.keyboard.press('Alt+w');
  await expect(page.getByText('Your domain is open')).toBeVisible();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('Play on a character page lands in a public lobby with that character', async ({ page }) => {
  await register(page, 'play');
  await page.goto('/characters/gojo');
  await page.getByRole('button', { name: /Play Satoru/ }).click();
  await page.waitForURL(/\/lobby\/[A-Z0-9]{3}-[A-Z0-9]{3}$/);

  await expect(page.getByRole('button', { name: 'Satoru Gojo' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('definition').filter({ hasText: /^Public$/ })).toBeVisible();
});

test('shows the time left to the right of the energy bar', async ({ page }, testInfo) => {
  await startRace(page, '1 min');
  const energy = (await page.getByText('Cursed energy').boundingBox())!;
  const clock = (await page.getByText('Time left').boundingBox())!;
  expect(clock.x).toBeGreaterThan(energy.x + energy.width);
  await page.screenshot({ path: testInfo.outputPath('timer.png') });
});

