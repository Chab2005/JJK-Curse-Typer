import { describe, expect, it } from 'vitest';
import { isCompletePin, PIN_ALPHABET } from '@/components/home/join';
import { viewerRole } from '@/components/lobby/lobbyRoom';
import { DEFAULT_LOBBY_SETTINGS, newLobbyCode, newLobbyRoom, viewLobby } from '@/components/lobby/newLobby';

const HOST = { id: 'Megumi_Shadows', name: 'Megumi_Shadows', avatar: 'megumi' as const };

describe('newLobbyCode (LOB-3)', () => {
  it('tire un code XXX-XXX sans caractères ambigus', () => {
    for (let i = 0; i < 50; i++) {
      const code = newLobbyCode(new Set());
      expect(isCompletePin(code)).toBe(true);
      expect([...code.replace('-', '')].every((char) => PIN_ALPHABET.includes(char))).toBe(true);
    }
  });

  it('évite les codes déjà pris', () => {
    const rolls = [0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5];
    const random = () => rolls.shift() ?? 0.9;
    expect(newLobbyCode(new Set(['AAA-AAA']), random)).not.toBe('AAA-AAA');
  });
});

describe('newLobbyRoom', () => {
  it('ouvre un salon d’attente où l’hôte est seul, avec les réglages par défaut', () => {
    const room = newLobbyRoom('ABC-DEF', 'Lobby de Megumi', HOST);
    expect(room).toMatchObject({ code: 'ABC-DEF', name: 'Lobby de Megumi', status: 'waiting', hostId: HOST.id, spectators: [] });
    expect(room.participants).toEqual([{ kind: 'human', ...HOST, ready: true }]);
    expect(room.settings).toEqual(DEFAULT_LOBBY_SETTINGS);
  });

  it('a des réglages par défaut en vrai texte FR + EN, sans timer ni bonus, privé (LOB-4)', () => {
    expect(DEFAULT_LOBBY_SETTINGS).toMatchObject({ languages: ['en', 'fr'], content: 'sentences', words: 50, timer: 0, errorMode: 'accumulate', bonus: false, capacity: 10, visibility: 'private' });
  });
});

describe('viewLobby', () => {
  const room = newLobbyRoom('ABC-DEF', 'Lobby', HOST);
  const yuji = { id: 'Yuji', name: 'Yuji Itadori', avatar: null };

  it('montre le salon tel quel à son hôte', () => {
    expect(viewLobby(room, HOST, false)).toBe(room);
  });

  it('fait rejoindre un visiteur comme participant pas encore prêt', () => {
    const seen = viewLobby(room, yuji, false);
    expect(viewerRole(seen, 'Yuji')).toBe('player');
    expect(seen.participants.at(-1)).toMatchObject({ id: 'Yuji', name: 'Yuji Itadori', ready: false });
  });

  it('met le visiteur en spectateur s’il le demande ou si le salon est plein', () => {
    expect(viewerRole(viewLobby(room, yuji, true), 'Yuji')).toBe('spectator');
    const full = { ...room, settings: { ...room.settings, capacity: 1 } };
    expect(viewerRole(viewLobby(full, yuji, false), 'Yuji')).toBe('spectator');
  });

  it('montre le salon tel quel à un visiteur anonyme', () => {
    expect(viewLobby(room, { id: '', name: '', avatar: null }, false)).toBe(room);
  });
});
