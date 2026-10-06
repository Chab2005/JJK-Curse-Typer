import { expect, test } from '@playwright/test';

// Pages introuvables : chaque URL inconnue répond 404 avec le message de sa section.
const CASES = [
  { path: '/FOOBAR', title: "This page doesn't exist" },
  { path: '/lobbies/FOOBAR', title: "This page doesn't exist" },
  { path: '/profile/FOOBAR', title: "This player doesn't exist" },
  { path: '/settings/FOOBAR', title: 'There are no secret settings' },
  { path: '/lobby/FOOBAR', title: "This lobby doesn't exist" },
];

for (const { path, title } of CASES) {
  test(`${path} answers 404`, async ({ page }) => {
    const response = await page.goto(path);

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  });
}
