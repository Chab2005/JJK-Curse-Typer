import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lobbyInvites } from '@/db/schema';
import { LOBBY_TTL_MS, clearLobbies, createLobby, storedLobby, updateLobby } from '@/lib/lobbies';

const deleted = vi.fn();
const revoked = vi.fn();

vi.mock('server-only', () => ({}));
vi.mock('@/db', () => ({
  db: {
    delete: (table: unknown) => ({ where: () => Promise.resolve(deleted(table)) }),
    update: (table: unknown) => ({ set: (values: unknown) => ({ where: () => Promise.resolve(revoked(table, values)) }) }),
  },
}));

const HOST = { id: 'Megumi_Shadows', name: 'Megumi_Shadows', avatar: 'megumi' as const };
const name = (host: string) => `Lobby de ${host}`;

beforeEach(() => {
  clearLobbies();
  deleted.mockClear();
  revoked.mockClear();
});

describe('liens d’invitation d’un lobby fermé (SALLE-04)', () => {
  it('supprime les liens quand le dernier humain quitte le lobby', async () => {
    await import('@/lib/invites');
    const room = createLobby(name, HOST, Date.now());
    updateLobby(room.code, { type: 'leave', id: HOST.id });
    await vi.waitFor(() => expect(deleted).toHaveBeenCalledWith(lobbyInvites));
  });

  it('supprime les liens d’un lobby expiré dès qu’on le lit', async () => {
    await import('@/lib/invites');
    const room = createLobby(name, HOST, 1000);
    expect(storedLobby(room.code, 1000 + LOBBY_TTL_MS + 1)).toBeNull();
    await vi.waitFor(() => expect(deleted).toHaveBeenCalledWith(lobbyInvites));
  });

  it('garde les liens tant que le lobby vit', async () => {
    await import('@/lib/invites');
    const room = createLobby(name, HOST, Date.now());
    updateLobby(room.code, { type: 'addBot', by: HOST.id, level: 'grade_4' });
    expect(deleted).not.toHaveBeenCalled();
  });

  it('révoque les liens de l’expulsé sans les supprimer', async () => {
    const { revokeInvites } = await import('@/lib/invites');
    await revokeInvites('ABC-DEF', 'Yuji');
    expect(revoked).toHaveBeenCalledWith(lobbyInvites, { revokedAt: expect.any(Date) });
    expect(deleted).not.toHaveBeenCalled();
  });
});
