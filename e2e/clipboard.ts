import type { BrowserContext } from '@playwright/test';

/**
 * Laisse les boutons « Copier » écrire dans le presse-papiers. Seul Chromium a besoin de ces permissions ; Firefox copie
 * sur un clic sans elles et refuse ces noms (`Unknown permission: clipboard-read`).
 */
export async function allowClipboard(context: BrowserContext): Promise<void> {
  if (context.browser()?.browserType().name() === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
}
