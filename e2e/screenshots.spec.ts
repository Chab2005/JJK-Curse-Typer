import { test } from '@playwright/test';
import { ORIGINS, PAGES } from './pages';

// Capture pleine page de tout le site, par langue et par appareil : `npm run screenshots`,
// images dans e2e/screenshots/<appareil>/ (non versionnées).
for (const [locale, origin] of Object.entries(ORIGINS)) {
  for (const { name, path } of PAGES) {
    test(`${locale} ${name} @screenshot`, async ({ page }, info) => {
      await page.goto(origin + path);
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `e2e/screenshots/${info.project.name}/${locale}-${name}.png`, fullPage: true });
    });
  }
}
