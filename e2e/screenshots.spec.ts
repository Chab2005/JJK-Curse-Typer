import { test } from '@playwright/test';
import { LOCALE_PREFIXES, PAGES } from './pages';

// Capture pleine page de tout le site, par langue et par appareil : `npm run screenshots`,
// images dans e2e/screenshots/<appareil>/ (non versionnées).
for (const [locale, prefix] of Object.entries(LOCALE_PREFIXES)) {
  for (const { name, path } of PAGES) {
    test(`${locale} ${name} @screenshot`, async ({ page }, info) => {
      await page.goto(path === '/' ? prefix || '/' : prefix + path);
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `e2e/screenshots/${info.project.name}/${locale}-${name}.png`, fullPage: true });
    });
  }
}
