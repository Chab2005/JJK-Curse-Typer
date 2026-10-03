import { describe, expect, it } from 'vitest';
import { viewerRole } from '@/components/lobby/lobbyRoom';
import { findSampleRoom } from '@/components/lobby/sampleRooms';
import { SAMPLE_LOBBIES } from '@/components/lobbies/sampleLobbies';

const ME = 'Megumi_Shadows';

describe('findSampleRoom', () => {
  it('renvoie null pour un code inconnu', () => {
    expect(findSampleRoom('ZZZ-999', ME, false)).toBeNull();
  });

  it('accepte un code en minuscules ou entouré d’espaces', () => {
    expect(findSampleRoom(' shj-60s ', ME, false)?.code).toBe('SHJ-60S');
  });

  it("reprend le résumé du lobby : nom, hôte, nombre de joueurs et paramètres", () => {
    const summary = SAMPLE_LOBBIES.find((l) => l.code === 'DMN-INF')!;
    const room = findSampleRoom('DMN-INF', 'Spectateur', true)!;

    expect(room.name).toBe(summary.name);
    expect(room.hostId).toBe(summary.host);
    expect(room.participants).toHaveLength(summary.players);
    expect(room.settings).toMatchObject({ languages: summary.languages, chars: summary.chars, words: summary.words, bonus: summary.bonus, capacity: summary.capacity });
  });

  it("fait rejoindre le visiteur comme participant d'un lobby joignable", () => {
    const room = findSampleRoom('SHJ-60S', ME, false)!;
    expect(viewerRole(room, ME)).toBe('player');
    expect(room.participants).toHaveLength(14);
    expect(room.participants.at(-1)).toMatchObject({ id: ME, ready: false });
  });

  it('place le visiteur en spectateur avec ?spectate=1, ou si le lobby est complet ou en course', () => {
    expect(viewerRole(findSampleRoom('SHJ-60S', ME, true)!, ME)).toBe('spectator');
    expect(viewerRole(findSampleRoom('DJO-ZEN', ME, false)!, ME)).toBe('spectator');
    expect(viewerRole(findSampleRoom('BLK-FLS', ME, false)!, ME)).toBe('spectator');
    expect(findSampleRoom('BLK-FLS', ME, false)!.spectators.some((s) => s.id === ME)).toBe(true);
  });

  it("donne le rôle d'hôte au visiteur dans son propre lobby", () => {
    const room = findSampleRoom('TKY-HGH', ME, false)!;
    expect(viewerRole(room, ME)).toBe('host');
    expect(room.participants.filter((p) => p.id === ME)).toHaveLength(1);
  });

  it('donne des identifiants uniques à tous les présents', () => {
    for (const lobby of SAMPLE_LOBBIES) {
      const room = findSampleRoom(lobby.code, ME, false)!;
      const all = [...room.participants, ...room.spectators].map((p) => p.id);
      expect(new Set(all).size).toBe(all.length);
    }
  });
});
