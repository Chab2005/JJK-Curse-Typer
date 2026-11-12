import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Viewer } from '@/lib/currentUser';
import { CODE_MAX_FAILURES } from '@/lib/codeAttempts';
import { clearCodeAttempts, codeLocked } from '@/lib/codeGuard';
import { clearLobbies, createLobby, updateLobby } from '@/lib/lobbies';

const state = { viewer: null as Viewer | null };

vi.mock('server-only', () => ({}));
// `cache` de React ne mémorise qu'en rendu serveur : ici chaque appel est une requête.
vi.mock('react', async (original) => ({ ...(await original<typeof import('react')>()), cache: <T>(fn: T) => fn }));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-real-ip': '10.0.0.9' }) }));
vi.mock('@/lib/currentUser', () => ({ getViewer: async () => state.viewer }));
vi.mock('@/lib/invites', () => ({ inviteOpens: async () => false }));
vi.mock('@/lib/sampleData', () => ({ showSampleData: () => false }));

const { openLobby } = await import('@/lib/openLobby');

const HOST = { id: 'gojo', name: 'gojo', avatar: null };

beforeEach(() => {
  clearLobbies();
  clearCodeAttempts();
  state.viewer = { kind: 'user', id: 'yuji', name: 'yuji', photo: null };
});

describe('openLobby et la force brute sur les codes (SALLE-10)', () => {
  it('ouvre un salon à code sans compter de tentative', async () => {
    const { code } = createLobby((h) => h, HOST);
    updateLobby(code, { type: 'updateSettings', by: 'gojo', patch: { visibility: 'code' } });
    expect(await openLobby(code, {})).toMatchObject({ code });
    expect(codeLocked('10.0.0.9')).toBe(false);
  });

  it('compte un code inconnu et un salon privé sans lien, puis renvoie blocked', async () => {
    const { code } = createLobby((h) => h, HOST);
    for (let i = 0; i < CODE_MAX_FAILURES - 1; i++) expect(await openLobby('ZZZ-ZZZ', {})).toBeNull();
    expect(await openLobby(code, {})).toBeNull();
    expect(await openLobby('ZZZ-ZZZ', {})).toBe('blocked');
  });

  it('ouvre toujours le salon à qui y est déjà', async () => {
    const { code } = createLobby((h) => h, HOST);
    for (let i = 0; i < CODE_MAX_FAILURES; i++) await openLobby('ZZZ-ZZZ', {});
    state.viewer = { kind: 'user', id: 'gojo', name: 'gojo', photo: null };
    expect(await openLobby(code, {})).toMatchObject({ code });
  });
});
