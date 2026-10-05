import { beforeEach, describe, expect, it, vi } from 'vitest';
import { viewerRole } from '@/components/lobby/lobbyRoom';
import { LOBBY_TTL_MS, clearLobbies, createLobby, findLobby, listPublicLobbies, parseLobbyAction, storedLobby, subscribeLobby, updateLobby } from '@/lib/lobbies';

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

describe('storedLobby', () => {
  it('renvoie le lobby créé tel qu’enregistré, sans y ajouter de visiteur', () => {
    const room = createLobby(name, HOST, 1000);
    expect(storedLobby(room.code.toLowerCase())).toEqual(room);
  });

  it('renvoie null pour un lobby de démonstration ou inconnu', () => {
    expect(storedLobby('TKY-HGH')).toBeNull();
    expect(storedLobby('ZZZ-ZZZ')).toBeNull();
  });
});

describe('listPublicLobbies (LOB-2)', () => {
  it('ne liste que les lobbies créés rendus publics', () => {
    const hidden = createLobby(name, HOST, 1000);
    const listed = createLobby(name, HOST, 1000);
    const byCode = createLobby(name, HOST, 1000);
    updateLobby(listed.code, { type: 'updateSettings', by: HOST.id, patch: { visibility: 'public' } });
    updateLobby(byCode.code, { type: 'updateSettings', by: HOST.id, patch: { visibility: 'code' } });

    const codes = listPublicLobbies(1000).map((l) => l.code);
    expect(codes).toEqual([listed.code]);
    expect(codes).not.toContain(hidden.code);
  });

  it('oublie les lobbies expirés', () => {
    const room = createLobby(name, HOST, 1000);
    updateLobby(room.code, { type: 'updateSettings', by: HOST.id, patch: { visibility: 'public' } });
    expect(listPublicLobbies(1000 + LOBBY_TTL_MS + 1)).toEqual([]);
  });
});

describe('updateLobby', () => {
  it('rejoue l’action de l’hôte sur le lobby enregistré (LOB-8)', () => {
    const room = createLobby(name, HOST, 1000);
    updateLobby(room.code, { type: 'addBot', by: HOST.id, level: 'grade_1' });
    expect(findLobby(room.code, HOST.id, false)!.participants.map((p) => p.id)).toEqual([HOST.id, 'bot-1']);
  });

  it('refuse les actions d’hôte venant d’un autre participant', () => {
    const room = createLobby(name, HOST, 1000);
    updateLobby(room.code, { type: 'addBot', by: 'Yuji', level: 'grade_1' });
    expect(findLobby(room.code, HOST.id, false)!.participants).toHaveLength(1);
  });

  it('ne touche pas aux lobbies de démonstration', () => {
    expect(updateLobby('TKY-HGH', { type: 'addBot', by: HOST.id, level: 'grade_1' })).toBeNull();
  });

  it('enregistre un nouveau venu : tout le monde le voit ensuite', () => {
    const room = createLobby(name, HOST, 1000);
    updateLobby(room.code, { type: 'join', person: { id: 'Yuji', name: 'Yuji', avatar: null }, spectate: false });
    expect(storedLobby(room.code)!.participants.map((p) => p.id)).toEqual([HOST.id, 'Yuji']);
  });

  it('oublie le lobby quand le dernier humain le quitte', () => {
    const room = createLobby(name, HOST, 1000);
    updateLobby(room.code, { type: 'addBot', by: HOST.id, level: 'grade_1' });
    updateLobby(room.code, { type: 'leave', id: HOST.id });
    expect(storedLobby(room.code)).toBeNull();
  });
});

describe('subscribeLobby', () => {
  it('prévient les abonnés de chaque changement, puis de la fermeture du lobby', () => {
    const room = createLobby(name, HOST, 1000);
    const listener = vi.fn();
    const unsubscribe = subscribeLobby(room.code.toLowerCase(), listener);

    updateLobby(room.code, { type: 'addBot', by: HOST.id, level: 'grade_1' });
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ participants: expect.arrayContaining([expect.objectContaining({ id: 'bot-1' })]) }));

    updateLobby(room.code, { type: 'addBot', by: 'Yuji', level: 'grade_1' });
    expect(listener).toHaveBeenCalledTimes(1);

    updateLobby(room.code, { type: 'leave', id: HOST.id });
    expect(listener).toHaveBeenLastCalledWith(null);

    unsubscribe();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});

describe('parseLobbyAction', () => {
  it('impose le visiteur comme auteur de l’action, quoi qu’envoie le client', () => {
    expect(parseLobbyAction({ type: 'addBot', by: 'Someone_Else', level: 'grade_4' }, HOST.id)).toEqual({ type: 'addBot', by: HOST.id, level: 'grade_4' });
    expect(parseLobbyAction({ type: 'setReady', id: 'Someone_Else', ready: true }, HOST.id)).toEqual({ type: 'setReady', id: HOST.id, ready: true });
  });

  it('valide les réglages envoyés', () => {
    expect(parseLobbyAction({ type: 'updateSettings', patch: { words: 80, bonus: true } }, HOST.id)).toEqual({ type: 'updateSettings', by: HOST.id, patch: { words: 80, bonus: true } });
    expect(parseLobbyAction({ type: 'updateSettings', patch: { visibility: 'code' } }, HOST.id)).toEqual({ type: 'updateSettings', by: HOST.id, patch: { visibility: 'code' } });
    expect(parseLobbyAction({ type: 'updateSettings', patch: { visibility: 'secret' } }, HOST.id)).toBeNull();
    expect(parseLobbyAction({ type: 'updateSettings', patch: { languages: ['de'] } }, HOST.id)).toBeNull();
    expect(parseLobbyAction({ type: 'updateSettings', patch: { hostId: 'me' } }, HOST.id)).toBeNull();
  });

  it('accepte de passer spectateur et de lancer la course, au nom du visiteur', () => {
    expect(parseLobbyAction({ type: 'setSpectating', id: 'Someone_Else', spectating: true }, HOST.id)).toEqual({ type: 'setSpectating', id: HOST.id, spectating: true });
    expect(parseLobbyAction({ type: 'start' }, HOST.id)).toEqual({ type: 'start', by: HOST.id });
  });

  it('refuse les arrivées, départs et fins de course venant du client', () => {
    expect(parseLobbyAction({ type: 'join', person: { id: 'x', name: 'x', avatar: null }, spectate: false }, HOST.id)).toBeNull();
    expect(parseLobbyAction({ type: 'leave', id: 'Yuji' }, HOST.id)).toBeNull();
    expect(parseLobbyAction({ type: 'finish' }, HOST.id)).toBeNull();
  });

  it('rejette les actions inconnues', () => {
    expect(parseLobbyAction({ type: 'deleteEverything' }, HOST.id)).toBeNull();
    expect(parseLobbyAction('nope', HOST.id)).toBeNull();
  });
});
