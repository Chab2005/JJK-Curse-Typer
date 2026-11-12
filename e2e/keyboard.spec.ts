import { expect, test } from '@playwright/test';

// Navigation au clavier (A11Y-04) : le premier Tab atteint le lien d'évitement, visible, qui saute vers <main>.
test('le lien d’évitement apparaît au premier Tab et mène au contenu principal', async ({ page }) => {
  await page.goto('/lobbies');
  await page.keyboard.press('Tab');

  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

test('chaque contrôle atteint au Tab montre un contour de focus', async ({ page }) => {
  await page.goto('/lobbies');
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      return { width: parseFloat(style.outlineWidth), style: style.outlineStyle, shadow: style.boxShadow, hasOwnRing: el.className.includes('focus-visible:') };
    });
    expect(outline).not.toBeNull();
    // Contour global, ou anneau propre au composant (Segmented, BevelSelect : cadre qui s'allume).
    expect(outline!.width > 0 && outline!.style !== 'none' || outline!.hasOwnRing || outline!.shadow !== 'none').toBe(true);
  }
});
