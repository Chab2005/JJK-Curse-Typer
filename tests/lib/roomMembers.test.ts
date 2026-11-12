import { beforeEach, describe, expect, it, vi } from 'vitest';
import { roomMembers } from '@/db/schema';
import { LOBBY_TTL_MS, clearLobbies, createLobby, storedLobby, updateLobby } from '@/lib/lobbies';

const deleted = vi.fn();
const upserted = vi.fn();
let rows: { lobbyCode: string }[] = [];

vi.mock('server-only', () => ({}));
vi.mock('@/db', () => ({
  db: {
    select: () => ({ from: () => ({ where: () => Promise.resolve(rows) }) }),
    delete: (table: unknown) => ({ where: () => Promise.resolve(deleted(table)) }),
    insert: (table: unknown) => ({
      values: (values: unknown) => ({ onConflictDoUpdate: (conflict: unknown) => Promise.resolve(upserted(table, values, conflict)) }),
    }),
  },
}));

const HOST = { id: 'Megumi_Shadows', name: 'Megumi_Shadows', avatar: 'megumi' as const };
const name = (host: string) => `Lobby de ${host}`;

beforeEach(() => {
  clearLobbies();
  deleted.mockClear();
  upserted.mockClear();
  rows = [];
});

describe('room_members (SALLE-06)', () => {
  it('lit le lobby où se trouve un visiteur', async () => {
    const { currentLobby } = await import('@/lib/roomMembers');
    expect(await currentLobby('Yuji')).toBeNull();
    rows = [{ lobbyCode: 'ABC-DEF' }];
    expect(await currentLobby('Yuji')).toBe('ABC-DEF');
  });

  it('enregistre le lobby d’un visiteur en remplaçant le précédent', async () => {
    const { setMembership } = await import('@/lib/roomMembers');
    await setMembership('Yuji', 'ABC-DEF');
    expect(upserted).toHaveBeenCalledWith(roomMembers, { viewerId: 'Yuji', lobbyCode: 'ABC-DEF' }, expect.objectContaining({ target: roomMembers.viewerId }));
  });

  it('libère le visiteur quand il quitte son lobby', async () => {
    await import('@/lib/roomMembers');
    const room = createLobby(name, HOST, Date.now());
    updateLobby(room.code, { type: 'updateSettings', by: HOST.id, patch: { visibility: 'public' } });
    updateLobby(room.code, { type: 'join', person: { id: 'Yuji', name: 'Yuji', avatar: null }, spectate: false });
    deleted.mockClear();
    updateLobby(room.code, { type: 'leave', id: 'Yuji' });
    await vi.waitFor(() => expect(deleted).toHaveBeenCalledWith(roomMembers));
  });

  it('libère tout le monde quand le lobby expire', async () => {
    await import('@/lib/roomMembers');
    const room = createLobby(name, HOST, 1000);
    expect(storedLobby(room.code, 1000 + LOBBY_TTL_MS + 1)).toBeNull();
    await vi.waitFor(() => expect(deleted).toHaveBeenCalledWith(roomMembers));
  });
});
