import type { Page } from '@playwright/test';

/** Crée un compte neuf (nom unique) par le formulaire d'inscription ; revient sur l'accueil, connecté. */
export async function register(page: Page, prefix = 'e2e'): Promise<{ username: string; password: string }> {
  const username = `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.slice(0, 20);
  const password = 'correct-horse-battery';
  await page.goto('/register');
  await page.getByLabel(/^Username/).fill(username);
  await page.getByLabel(/^Password/).fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('/');
  return { username, password };
}

/** Sous `lg`, la zone compte (déconnexion, connexion) est dans le menu hamburger : l'ouvre d'abord. */
export async function openAccountControls(page: Page, isMobile: boolean): Promise<void> {
  if (isMobile) await page.getByRole('button', { name: 'Open menu' }).click();
}
