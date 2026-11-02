import { expect, test } from '@playwright/test';

test('Gojo, Megumi and Yuta have live pixel domains on their character files (UI-4, UI-7, GEN-3)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const [character, name] of [['gojo', 'Unlimited Void'], ['megumi', 'Chimera Shadow Garden'], ['yuta', 'Mutual Authentic Love']]) {
    await page.goto(`/characters/${character}?lang=en`);
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    const scene = page.locator(`[data-domain="${character}"]`), canvas = scene.locator('canvas');
    await scene.scrollIntoViewIfNeeded();
    await expect(canvas).toHaveAttribute('width', '400');
    await expect(canvas).toHaveAttribute('height', '220');
    await expect(canvas).toHaveCSS('image-rendering', 'pixelated');
    await expect.poll(() => canvas.evaluate((el: HTMLCanvasElement) => {
      const pixels = el.getContext('2d')!.getImageData(0, 0, el.width, el.height).data;
      return pixels.some((value, i) => i % 4 !== 3 && value !== 0);
    })).toBe(true);
    const firstFrame = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
    await expect.poll(() => canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())).not.toBe(firstFrame);
    const box = await scene.boundingBox();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Changing this preference draws the fully revealed domain once, then holds it.
    await page.waitForTimeout(100);
    const still = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
    await page.waitForTimeout(150);
    expect(await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())).toBe(still);
    expect(await scene.boundingBox()).toEqual(box);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  }
  await page.goto('/fr/characters/megumi?lang=fr');
  await expect(page.getByRole('heading', { name: 'Jardin des ombres chimériques' })).toBeVisible();
  await expect(page.getByText('Extension du territoire', { exact: true })).toBeVisible();
  await page.goto('/fr/characters/yuta?lang=fr');
  await expect(page.getByRole('heading', { name: 'Amour authentique mutuel' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('the guide uses the pixel void for Gojo and the shared Maki illustration', async ({ page }) => {
  await page.goto('/characters?lang=en');
  await expect(page.locator('[data-domain="gojo"] canvas')).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'Domain Expansion', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Heavenly Restriction', exact: true })).toBeVisible();
});
