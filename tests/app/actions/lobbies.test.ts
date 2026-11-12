import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Viewer } from '@/lib/currentUser';
import { CODE_MAX_FAILURES } from '@/lib/codeAttempts';
import { clearCodeAttempts, codeLocked } from '@/lib/codeGuard';
import { clearLobbies, createLobby, storedLobby, updateLobby } from '@/lib/lobbies';

// Actions serveur des lobbies, avec leurs dépendances d'E/S remplacées : session, en-têtes, base.

const state = { viewer: null as Viewer | null, ip: '10.0.0.1' };

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-real-ip': state.ip }) }));
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string, values?: { host?: string }) => `${key}:${values?.host ?? ''}` }));
vi.mock('@/lib/currentUser', () => ({
  getViewer: async () => state.viewer,
  getViewerId: async () => state.viewer?.id ?? '',
}));
vi.mock('@/lib/invites', () => ({
  claimInvite: async () => false,
  createInvites: async () => [],
  deleteInvite: async () => {},
  deleteInvites: async () => {},
  listInvites: async () => [],
  revokeInvites: async () => {},
}));
vi.mock('@/lib/roomMembers', () => ({ currentLobby: async () => null, setMembership: async () => {} }));
vi.mock('@/lib/lobbyPresence', () => ({ expectViewer: () => {} }));
vi.mock('@/lib/passages', () => ({ loadPassages: async () => [] }));

const { joinLobbyAction, updateLobbyAction } = await import('@/app/actions/lobbies');

const user = (id: string): Viewer => ({ kind: 'user', id, name: id, photo: null });
const HOST = { id: 'gojo', name: 'gojo', avatar: null };

/** Lobby créé par `gojo`, rendu joignable par code. */
function codeLobby(): string {
  const { code } = createLobby((host) => `Lobby de ${host}`, HOST);
  updateLobby(code, { type: 'updateSettings', by: HOST.id, patch: { visibility: 'code' } });
  return code;
}

beforeEach(() => {
  clearLobbies();
  clearCodeAttempts();
  state.viewer = user('yuji');
  state.ip = '10.0.0.1';
});

describe('joinLobbyAction et la force brute sur les codes (SALLE-10)', () => {
  it('fait entrer avec un bon code sans compter de tentative', async () => {
    const code = codeLobby();
    const room = await joinLobbyAction(code);
    expect(room && 'participants' in room && room.participants.some((p) => p.id === 'yuji')).toBe(true);
    expect(codeLocked('10.0.0.1')).toBe(false);
  });

  it('bloque l’IP après 10 codes inconnus, puis refuse même un bon code', async () => {
    const code = codeLobby();
    for (let i = 0; i < CODE_MAX_FAILURES; i++) expect(await joinLobbyAction('ZZZ-ZZZ')).toBeNull();
    expect(await joinLobbyAction(code)).toEqual({ blocked: true });
    expect(storedLobby(code)?.participants.some((p) => p.id === 'yuji')).toBe(false);
  });

  it('compte un salon privé ouvert sans lien comme un échec', async () => {
    const { code } = createLobby((host) => host, HOST);
    for (let i = 0; i < CODE_MAX_FAILURES; i++) expect(await joinLobbyAction(code)).toBeNull();
    expect(codeLocked('10.0.0.1')).toBe(true);
  });

  it('laisse rentrer quelqu’un déjà dans le salon malgré le blocage', async () => {
    const code = codeLobby();
    await joinLobbyAction(code);
    for (let i = 0; i < CODE_MAX_FAILURES; i++) await joinLobbyAction('ZZZ-ZZZ');
    const again = await joinLobbyAction(code);
    expect(again && 'participants' in again).toBe(true);
  });

  it('ne bloque pas une autre IP', async () => {
    const code = codeLobby();
    for (let i = 0; i < CODE_MAX_FAILURES; i++) await joinLobbyAction('ZZZ-ZZZ');
    state.ip = '10.0.0.2';
    const room = await joinLobbyAction(code);
    expect(room && 'participants' in room).toBe(true);
  });
});

describe('updateLobbyAction sur l’écran des résultats (COURSE-11)', () => {
  /** Lobby de `gojo` en résultats, avec `yuji` dedans. */
  async function finished(): Promise<string> {
    const code = codeLobby();
    await joinLobbyAction(code);
    updateLobby(code, { type: 'setReady', id: 'yuji', ready: true });
    updateLobby(code, { type: 'start', by: HOST.id });
    updateLobby(code, { type: 'finish' });
    return code;
  }

  it('relance pour l’hôte', async () => {
    const code = await finished();
    state.viewer = user('gojo');
    expect(await updateLobbyAction(code, { type: 'restart' })).toMatchObject({ status: 'waiting' });
  });

  it('ferme pour l’hôte : le lobby disparaît', async () => {
    const code = await finished();
    state.viewer = user('gojo');
    expect(await updateLobbyAction(code, { type: 'close' })).toBeNull();
    expect(storedLobby(code)).toBeNull();
  });

  it('refuse à un autre joueur, même s’il se dit hôte', async () => {
    const code = await finished();
    expect(await updateLobbyAction(code, { type: 'close', by: 'gojo' })).toMatchObject({ status: 'results' });
    expect(await updateLobbyAction(code, { type: 'restart' })).toMatchObject({ status: 'results' });
    expect(storedLobby(code)?.status).toBe('results');
  });

  it('rejette une action mal formée', async () => {
    const code = await finished();
    state.viewer = user('gojo');
    expect(await updateLobbyAction('not a code', { type: 'close' })).toBeNull();
    expect(await updateLobbyAction(code, { type: 'shutdown' })).toBeNull();
    expect(await updateLobbyAction(code, 'close')).toBeNull();
    expect(storedLobby(code)?.status).toBe('results');
  });
});
