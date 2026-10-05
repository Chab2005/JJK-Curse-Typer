import { type Browser, expect, type Page, test } from '@playwright/test';
import { register } from './auth';

// Salon d'attente temps réel avec deux vrais joueurs, chacun dans son propre navigateur (contexte) :
// arrivées, bots, réglages, passage en spectateur et départ de la course se voient chez l'autre sans recharger.

const participants = (page: Page) => page.getByRole('list', { name: /Exorcists/ });
const spectators = (page: Page) => page.locator('section[aria-labelledby="spectators-title"]');
const settings = (page: Page) => page.locator('section[aria-labelledby="settings-title"]');

test.skip(({ isMobile }) => isMobile, 'two browsers side by side: the desktop run covers it');
// Deux navigateurs, un compte créé et une course : plus long qu'un test d'une page.
test.describe.configure({ timeout: 90_000 });

async function newPage(browser: Browser) {
  const context = await browser.newContext();
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  return context.newPage();
}

/** Un compte neuf ouvre un lobby (privé par défaut) depuis l'accueil. */
async function hostLobby(browser: Browser) {
  const host = await newPage(browser);
  const { username } = await register(host, 'host');
  await host.getByRole('button', { name: 'Create a new lobby' }).click();
  await host.waitForURL(/\/lobby\/[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  return { host, username };
}

/** Un visiteur sans compte entre par `url` et choisit son pseudo d'invité. */
async function joinAsGuest(browser: Browser, url: string, name: string) {
  const guest = await newPage(browser);
  await guest.goto(url);
  await guest.getByLabel('Exorcist name').fill(name);
  await guest.getByRole('button', { name: 'Join the lobby' }).click();
  await expect(participants(guest).getByText(name)).toBeVisible();
  return guest;
}

async function setAccess(page: Page, access: 'Public' | 'Code' | 'Private') {
  await page.getByRole('button', { name: 'Edit settings' }).click();
  await page.getByRole('dialog').getByRole('group', { name: 'Access' }).getByRole('button', { name: access }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

test('an invite link works, even after a link preview bot fetched it', async ({ browser, request }) => {
  const { host } = await hostLobby(browser);
  await host.getByRole('button', { name: 'New invite link' }).click();
  await expect(host.getByLabel('Invite link')).toHaveValue(/\?invite=[\w-]{22}$/);
  const link = await host.getByLabel('Invite link').inputValue();

  // Robot d'aperçu (Discord, Slack…) : il charge la page depuis une autre IP, sans JavaScript.
  const preview = await request.get(link, { headers: { 'X-Real-IP': '203.0.113.9' } });
  expect(preview.status()).toBe(200);

  const guest = await joinAsGuest(browser, link, 'Nobara_e2e');
  await expect(participants(host).getByText('Nobara_e2e')).toBeVisible();
  // Une fois entré, la page n'a plus besoin du lien.
  await expect(guest).toHaveURL(/\/lobby\/[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  await guest.reload();
  await expect(participants(guest).getByText('Nobara_e2e')).toBeVisible();
});

test('two players see each other, the bots and the settings in realtime, then race together', async ({ browser }) => {
  const { host, username } = await hostLobby(browser);
  await setAccess(host, 'Public');
  const guest = await joinAsGuest(browser, host.url(), 'Yuji_e2e');

  await expect(participants(host).getByText('Yuji_e2e')).toBeVisible();
  await expect(participants(guest).getByText(username)).toBeVisible();

  await host.getByRole('button', { name: 'Add a bot' }).click();
  await expect(participants(guest).getByText('Cursed corpse 1')).toBeVisible();

  await setAccess(host, 'Code');
  await expect(settings(guest).getByRole('definition').getByText('Code', { exact: true })).toBeVisible();

  // Chacun peut passer spectateur, l'hôte compris, et tout le salon le voit.
  await guest.getByRole('button', { name: 'Watch as a spectator' }).click();
  await expect(spectators(host).getByText('Yuji_e2e')).toBeVisible();
  await expect(participants(host).getByText('Yuji_e2e')).toBeHidden();
  await guest.getByRole('button', { name: 'Join the race' }).click();
  await expect(participants(host).getByText('Yuji_e2e')).toBeVisible();

  await host.getByRole('button', { name: 'Watch as a spectator' }).click();
  await expect(spectators(guest).getByText(username)).toBeVisible();
  await host.getByRole('button', { name: 'Join the race' }).click();
  await expect(participants(guest).getByText(username)).toBeVisible();

  await expect(host.getByRole('button', { name: 'Start the race' })).toBeDisabled();
  await guest.getByRole('button', { name: "I'm ready" }).click();
  await expect(participants(host).getByText('Yuji_e2e').locator('xpath=..')).toContainText('Ready');
  await host.getByRole('button', { name: 'Start the race' }).click();

  // Le départ emmène tout le salon, chacun à son propre siège.
  await host.waitForURL(/\/race$/);
  await guest.waitForURL(/\/race$/);
  await expect(host.getByRole('list', { name: 'Live standings' })).toContainText(`${username} (you)`);
  await expect(guest.getByRole('list', { name: 'Live standings' })).toContainText('Yuji_e2e (you)');
});

test('a player who leaves disappears from the lobby for everyone', async ({ browser }) => {
  const { host } = await hostLobby(browser);
  await setAccess(host, 'Public');
  const guest = await joinAsGuest(browser, host.url(), 'Megumi_e2e');
  await expect(participants(host).getByText('Megumi_e2e')).toBeVisible();

  await guest.getByRole('link', { name: 'Leave the lobby' }).click();
  await guest.waitForURL(/\/lobbies$/);
  await expect(participants(host).getByText('Megumi_e2e')).toBeHidden();
});
