import { describe, expect, it } from 'vitest';
import { isQuickPlayOpen, pickQuickLobby } from '@/components/home/quickPlay';
import type { LobbyRoom, LobbySettings, Participant } from '@/components/lobby/lobbyRoom';
import { newLobbyRoom } from '@/components/lobby/newLobby';

const HOST = { id: 'Megumi_Shadows', name: 'Megumi_Shadows', avatar: null };

const bot = (number: number): Participant => ({ kind: 'bot', id: `bot-${number}`, level: 'grade_1', number });

function room(code: string, { players = 1, status = 'waiting', ...settings }: { players?: number; status?: LobbyRoom['status'] } & Partial<LobbySettings> = {}): LobbyRoom {
  const base = newLobbyRoom(code, code, HOST);
  return {
    ...base,
    status,
    participants: [...base.participants, ...Array.from({ length: players - 1 }, (_, i) => bot(i + 1))],
    settings: { ...base.settings, visibility: 'public', ...settings },
  };
}

describe('isQuickPlayOpen', () => {
  it('accepte un lobby public, en attente, avec une place libre', () => {
    expect(isQuickPlayOpen(room('AAA-AAA'))).toBe(true);
  });

  it('refuse un lobby à code ou privé (LOB-1)', () => {
    expect(isQuickPlayOpen(room('AAA-AAA', { visibility: 'code' }))).toBe(false);
    expect(isQuickPlayOpen(room('AAA-AAA', { visibility: 'private' }))).toBe(false);
  });

  it('refuse un lobby en course ou plein', () => {
    expect(isQuickPlayOpen(room('AAA-AAA', { status: 'racing' }))).toBe(false);
    expect(isQuickPlayOpen(room('AAA-AAA', { players: 4, capacity: 4 }))).toBe(false);
  });
});

const entry = (r: LobbyRoom, createdAt = 0) => ({ room: r, createdAt });

describe('pickQuickLobby (JOIN-03)', () => {
  it('renvoie null sans lobby ouvert', () => {
    expect(pickQuickLobby([])).toBeNull();
    expect(pickQuickLobby([entry(room('AAA-AAA', { visibility: 'private' })), entry(room('BBB-BBB', { status: 'racing' }))])).toBeNull();
  });

  it('choisit le lobby le plus proche de sa capacité maximale, pas le plus peuplé en valeur absolue', () => {
    // 8 joueurs sur 30 (22 places) contre 3 sur 4 (1 place) : le second est le plus proche d'être plein.
    const big = room('AAA-AAA', { players: 8, capacity: 30 });
    const small = room('BBB-BBB', { players: 3, capacity: 4 });
    expect(pickQuickLobby([entry(big), entry(small)])?.code).toBe('BBB-BBB');
  });

  it('ignore un lobby plus rempli mais fermé', () => {
    const rooms = [room('AAA-AAA', { players: 2, capacity: 4 }), room('BBB-BBB', { players: 4, capacity: 4 }), room('CCC-CCC', { players: 3, capacity: 4, visibility: 'code' })];
    expect(pickQuickLobby(rooms.map((r) => entry(r)))?.code).toBe('AAA-AAA');
  });

  it('à égalité de places restantes, garde le lobby créé le plus tôt', () => {
    const older = entry(room('AAA-AAA', { players: 2, capacity: 4 }), 100);
    const newer = entry(room('BBB-BBB', { players: 2, capacity: 4 }), 500);
    expect(pickQuickLobby([newer, older])?.code).toBe('AAA-AAA');
  });
});
