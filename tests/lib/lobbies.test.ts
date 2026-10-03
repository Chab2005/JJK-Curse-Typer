import { beforeEach, describe, expect, it } from 'vitest';
import { viewerRole } from '@/components/lobby/lobbyRoom';
import { LOBBY_TTL_MS, clearLobbies, createLobby, findLobby, parseLobbyAction, updateLobby } from '@/lib/lobbies';

const HOST = { id: 'Megumi_Shadows', name: 'Megumi_Shadows', avatar: 'megumi' as const };
const name = (host: string) => `Lobby de ${host}`;

beforeEach(() => clearLobbies());

describe('createLobby / findLobby', () => {
  it('garde le nouveau lobby en mémoire et le retrouve par son code, même en minuscules', () => {
    const room = createLobby(name, HOST, 1000);
    expect(room.name).toBe('Lobby de Megumi_Shadows');
    expect(findLobby(room.code.toLowerCase(), HOST.id, false)).toEqual(room);
  });

  it('fait rejoindre un autre visiteur sans modifier le lobby enregistré', () => {
    const room = createLobby(name, HOST, 1000);
    expect(viewerRole(findLobby(room.code, 'Yuji', false)!, 'Yuji')).toBe('player');
    expect(findLobby(room.code, HOST.id, false)!.participants).toHaveLength(1);
  });

  it('retombe sur les lobbies de démonstration, puis sur null', () => {
    expect(findLobby('TKY-HGH', HOST.id, false)?.name).toBe('Tokyo Jujutsu High');
    expect(findLobby('ZZZ-ZZZ', HOST.id, false)).toBeNull();
  });

  it('ne reprend jamais le code d’un lobby de démonstration', () => {
    for (let i = 0; i < 30; i++) expect(findLobby(createLobby(name, HOST, 1000).code, HOST.id, false)?.hostId).toBe(HOST.id);
  });

  it('oublie les lobbies créés depuis plus de 24 h', () => {
    const old = createLobby(name, HOST, 1000);
    createLobby(name, HOST, 1000 + LOBBY_TTL_MS + 1);
    expect(findLobby(old.code, HOST.id, false)).toBeNull();
  });
});

describe('updateLobby', () => {
  it('rejoue l’action de l’hôte sur le lobby enregistré (LOB-8)', () => {
    const room = createLobby(name, HOST, 1000);
    updateLobby(room.code, { type: 'addBot', by: HOST.id, level: 'expert' });
    expect(findLobby(room.code, HOST.id, false)!.participants.map((p) => p.id)).toEqual([HOST.id, 'bot-1']);
  });

  it('refuse les actions d’hôte venant d’un autre participant', () => {
    const room = createLobby(name, HOST, 1000);
    updateLobby(room.code, { type: 'addBot', by: 'Yuji', level: 'expert' });
    expect(findLobby(room.code, HOST.id, false)!.participants).toHaveLength(1);
  });

  it('ne touche pas aux lobbies de démonstration', () => {
    expect(updateLobby('TKY-HGH', { type: 'addBot', by: HOST.id, level: 'expert' })).toBeNull();
  });
});

describe('parseLobbyAction', () => {
  it('impose le visiteur comme auteur de l’action, quoi qu’envoie le client', () => {
    expect(parseLobbyAction({ type: 'addBot', by: 'Someone_Else', level: 'beginner' }, HOST.id)).toEqual({ type: 'addBot', by: HOST.id, level: 'beginner' });
    expect(parseLobbyAction({ type: 'setReady', id: 'Someone_Else', ready: true }, HOST.id)).toEqual({ type: 'setReady', id: HOST.id, ready: true });
  });

  it('valide les réglages envoyés', () => {
    expect(parseLobbyAction({ type: 'updateSettings', patch: { words: 80, bonus: true } }, HOST.id)).toEqual({ type: 'updateSettings', by: HOST.id, patch: { words: 80, bonus: true } });
    expect(parseLobbyAction({ type: 'updateSettings', patch: { languages: ['de'] } }, HOST.id)).toBeNull();
    expect(parseLobbyAction({ type: 'updateSettings', patch: { hostId: 'me' } }, HOST.id)).toBeNull();
  });

  it('rejette les actions inconnues', () => {
    expect(parseLobbyAction({ type: 'deleteEverything' }, HOST.id)).toBeNull();
    expect(parseLobbyAction('nope', HOST.id)).toBeNull();
  });
});
