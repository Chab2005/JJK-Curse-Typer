import { beforeEach, describe, expect, it, vi } from 'vitest';
import { viewerRole } from '@/components/lobby/lobbyRoom';
import { LOBBY_TTL_MS, clearLobbies, createLobby, findLobby, findQuickLobby, listPublicLobbies, onLobbyClosed, onMemberLeft, parseLobbyAction, storedLobby, subscribeLobby, updateLobby } from '@/lib/lobbies';

const HOST = { id: 'Megumi_Shadows', name: 'Megumi_Shadows', avatar: 'megumi' as const };
const name = (host: string) => `Lobby de ${host}`;

beforeEach(() => clearLobbies());

describe('createLobby / findLobby', () => {
  it('garde le nouveau lobby en mémoire et le retrouve par son code, même en minuscules', () => {
    const room = createLobby(name, HOST, Date.now());
    expect(room.name).toBe('Lobby de Megumi_Shadows');
    expect(findLobby(room.code.toLowerCase(), HOST.id, false)).toEqual(room);
  });

  it('fait rejoindre un autre visiteur sans modifier le lobby enregistré', () => {
    const room = createLobby(name, HOST, Date.now());
    expect(viewerRole(findLobby(room.code, 'Yuji', false)!, 'Yuji')).toBe('player');
    expect(findLobby(room.code, HOST.id, false)!.participants).toHaveLength(1);
  });

  it('retombe sur les lobbies de démonstration, puis sur null', () => {
    expect(findLobby('TKY-HGH', HOST.id, false)?.name).toBe('Tokyo Jujutsu High');
    expect(findLobby('ZZZ-ZZZ', HOST.id, false)).toBeNull();
  });

  it('ne reprend jamais le code d’un lobby de démonstration', () => {
    for (let i = 0; i < 30; i++) expect(findLobby(createLobby(name, HOST, Date.now()).code, HOST.id, false)?.hostId).toBe(HOST.id);
  });

  it('oublie les lobbies créés depuis plus de 24 h', () => {
    const old = createLobby(name, HOST, Date.now());
    const later = Date.now() + LOBBY_TTL_MS + 1;
    createLobby(name, HOST, later);
    expect(findLobby(old.code, HOST.id, false, later)).toBeNull();
  });
});

describe('storedLobby', () => {
  it('renvoie le lobby créé tel qu’enregistré, sans y ajouter de visiteur', () => {
    const room = createLobby(name, HOST, Date.now());
    expect(storedLobby(room.code.toLowerCase())).toEqual(room);
  });

  it('renvoie null pour un lobby de démonstration ou inconnu', () => {
    expect(storedLobby('TKY-HGH')).toBeNull();
    expect(storedLobby('ZZZ-ZZZ')).toBeNull();
  });
});

describe('findQuickLobby', () => {
  const open = (players: number) => {
    const room = createLobby(name, HOST, Date.now());
    updateLobby(room.code, { type: 'updateSettings', by: HOST.id, patch: { visibility: 'public' } });
    for (let i = 1; i < players; i++) updateLobby(room.code, { type: 'addBot', by: HOST.id, level: 'grade_1' });
    return room.code;
  };

  it('renvoie null sans lobby public ouvert', () => {
    createLobby(name, HOST, Date.now());
    expect(findQuickLobby(1000)).toBeNull();
  });

  it('choisit le lobby public ouvert le plus rempli', () => {
    open(2);
    const fullest = open(3);
    expect(findQuickLobby(1000)?.code).toBe(fullest);
  });

  it('ignore les lobbies expirés', () => {
    open(2);
    expect(findQuickLobby(Date.now() + LOBBY_TTL_MS + 1)).toBeNull();
  });
});

describe('listPublicLobbies (LOB-2)', () => {
  it('ne liste que les lobbies créés rendus publics', () => {
    const hidden = createLobby(name, HOST, Date.now());
    const listed = createLobby(name, HOST, Date.now());
    const byCode = createLobby(name, HOST, Date.now());
    updateLobby(listed.code, { type: 'updateSettings', by: HOST.id, patch: { visibility: 'public' } });
    updateLobby(byCode.code, { type: 'updateSettings', by: HOST.id, patch: { visibility: 'code' } });

    const codes = listPublicLobbies(1000).map((l) => l.code);
    expect(codes).toEqual([listed.code]);
    expect(codes).not.toContain(hidden.code);
  });

  it('oublie les lobbies expirés', () => {
    const room = createLobby(name, HOST, Date.now());
    updateLobby(room.code, { type: 'updateSettings', by: HOST.id, patch: { visibility: 'public' } });
    expect(listPublicLobbies(Date.now() + LOBBY_TTL_MS + 1)).toEqual([]);
  });
});

describe('updateLobby', () => {
  it('rejoue l’action de l’hôte sur le lobby enregistré (LOB-8)', () => {
    const room = createLobby(name, HOST, Date.now());
    updateLobby(room.code, { type: 'addBot', by: HOST.id, level: 'grade_1' });
    expect(findLobby(room.code, HOST.id, false)!.participants.map((p) => p.id)).toEqual([HOST.id, 'bot-1']);
  });

  it('refuse les actions d’hôte venant d’un autre participant', () => {
    const room = createLobby(name, HOST, Date.now());
    updateLobby(room.code, { type: 'addBot', by: 'Yuji', level: 'grade_1' });
    expect(findLobby(room.code, HOST.id, false)!.participants).toHaveLength(1);
  });

  it('ne touche pas aux lobbies de démonstration', () => {
    expect(updateLobby('TKY-HGH', { type: 'addBot', by: HOST.id, level: 'grade_1' })).toBeNull();
  });

  it('enregistre un nouveau venu : tout le monde le voit ensuite', () => {
    const room = createLobby(name, HOST, Date.now());
    updateLobby(room.code, { type: 'join', person: { id: 'Yuji', name: 'Yuji', avatar: null }, spectate: false });
    expect(storedLobby(room.code)!.participants.map((p) => p.id)).toEqual([HOST.id, 'Yuji']);
  });

  it('oublie le lobby quand le dernier humain le quitte', () => {
    const room = createLobby(name, HOST, Date.now());
    updateLobby(room.code, { type: 'addBot', by: HOST.id, level: 'grade_1' });
    updateLobby(room.code, { type: 'leave', id: HOST.id });
    expect(storedLobby(room.code)).toBeNull();
  });
});

describe('subscribeLobby', () => {
  it('prévient les abonnés de chaque changement, puis de la fermeture du lobby', () => {
    const room = createLobby(name, HOST, Date.now());
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
    expect(parseLobbyAction({ type: 'setCharacter', character: 'gojo', id: 'someone-else' }, HOST.id)).toEqual({ type: 'setCharacter', id: HOST.id, character: 'gojo' });
    expect(parseLobbyAction({ type: 'setCharacter', character: 'nanami' }, HOST.id)).toBeNull();
    expect(parseLobbyAction({ type: 'updateSettings', patch: { words: 80, gameMode: 'noDomain' } }, HOST.id)).toEqual({ type: 'updateSettings', by: HOST.id, patch: { words: 80, gameMode: 'noDomain' } });
    expect(parseLobbyAction({ type: 'updateSettings', patch: { visibility: 'code' } }, HOST.id)).toEqual({ type: 'updateSettings', by: HOST.id, patch: { visibility: 'code' } });
    expect(parseLobbyAction({ type: 'updateSettings', patch: { visibility: 'secret' } }, HOST.id)).toBeNull();
    expect(parseLobbyAction({ type: 'updateSettings', patch: { languages: ['de'] } }, HOST.id)).toBeNull();
    expect(parseLobbyAction({ type: 'updateSettings', patch: { hostId: 'me' } }, HOST.id)).toBeNull();
  });

  it('borne le timer à 0 ou 30–600 s et la capacité à 2–30 (CONF-01, SALLE-05)', () => {
    const patch = (value: object) => parseLobbyAction({ type: 'updateSettings', patch: value }, HOST.id);
    expect(patch({ timer: 600 })).not.toBeNull();
    expect(patch({ timer: 0 })).not.toBeNull();
    expect(patch({ timer: 601 })).toBeNull();
    expect(patch({ timer: 10 })).toBeNull();
    expect(patch({ timer: 45.5 })).toBeNull();
    expect(patch({ capacity: 30 })).not.toBeNull();
    expect(patch({ capacity: 31 })).toBeNull();
    expect(patch({ capacity: 1 })).toBeNull();
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

describe('relance et fermeture par l’hôte (COURSE-11)', () => {
  const YUJI = { id: 'Yuji', name: 'Yuji', avatar: null };

  /** Lobby en résultats avec l’hôte et Yuji. */
  function finished(): string {
    const { code } = createLobby(name, HOST, Date.now());
    updateLobby(code, { type: 'join', person: YUJI, spectate: false });
    updateLobby(code, { type: 'addBot', by: HOST.id, level: 'grade_4' });
    updateLobby(code, { type: 'setReady', id: YUJI.id, ready: true });
    updateLobby(code, { type: 'start', by: HOST.id });
    updateLobby(code, { type: 'finish' });
    return code;
  }

  it('accepte relancer et fermer, au nom du visiteur', () => {
    expect(parseLobbyAction({ type: 'restart' }, 'Yuji')).toEqual({ type: 'restart', by: 'Yuji' });
    expect(parseLobbyAction({ type: 'close', by: HOST.id }, 'Yuji')).toEqual({ type: 'close', by: 'Yuji' });
  });

  it('relance : le lobby repasse en attente pour tout le salon', () => {
    const code = finished();
    const seen = vi.fn();
    subscribeLobby(code, seen);
    updateLobby(code, { type: 'restart', by: HOST.id });
    expect(storedLobby(code)?.status).toBe('waiting');
    expect(seen).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'waiting' }));
  });

  it('ferme : le lobby quitte le registre, chacun est prévenu et sort', () => {
    const code = finished();
    const seen = vi.fn();
    const left = vi.fn();
    const closed = vi.fn();
    subscribeLobby(code, seen);
    const stopLeft = onMemberLeft(left);
    const stopClosed = onLobbyClosed(closed);
    updateLobby(code, { type: 'close', by: HOST.id });
    expect(storedLobby(code)).toBeNull();
    expect(seen).toHaveBeenLastCalledWith(null);
    expect(left).toHaveBeenCalledWith(code, HOST.id);
    expect(left).toHaveBeenCalledWith(code, 'Yuji');
    expect(closed).toHaveBeenCalledWith(code);
    stopLeft();
    stopClosed();
  });

  it('refuse la fermeture demandée par un autre que l’hôte', () => {
    const code = finished();
    updateLobby(code, { type: 'close', by: 'Yuji' });
    expect(storedLobby(code)?.status).toBe('results');
  });
});

describe('fermeture des lobbies (SALLE-04)', () => {
  it('prévient les écouteurs de fermeture quand le dernier humain part', () => {
    const closed = vi.fn();
    const stop = onLobbyClosed(closed);
    const room = createLobby(name, HOST, Date.now());
    updateLobby(room.code, { type: 'leave', id: HOST.id });
    expect(closed).toHaveBeenCalledWith(room.code);
    stop();
  });

  it('prévient aussi à l’expiration, et ne renvoie plus un lobby expiré à la lecture', () => {
    const closed = vi.fn();
    const stop = onLobbyClosed(closed);
    const room = createLobby(name, HOST, 1000);
    expect(storedLobby(room.code, 1000 + LOBBY_TTL_MS + 1)).toBeNull();
    expect(closed).toHaveBeenCalledWith(room.code);
    stop();
  });

  it('ne laisse pas ouvrir par findLobby un lobby expiré', () => {
    const room = createLobby(name, HOST, 1000);
    expect(findLobby(room.code, HOST.id, false, 1000 + LOBBY_TTL_MS + 1)).toBeNull();
  });

  it('ne prévient pas tant que le lobby vit', () => {
    const closed = vi.fn();
    const stop = onLobbyClosed(closed);
    const room = createLobby(name, HOST, Date.now());
    updateLobby(room.code, { type: 'addBot', by: HOST.id, level: 'grade_4' });
    expect(closed).not.toHaveBeenCalled();
    stop();
  });
});

describe('onMemberLeft (SALLE-06)', () => {
  it('annonce chaque humain qui quitte le lobby, jamais un bot', () => {
    const left = vi.fn();
    onMemberLeft(left);
    const room = createLobby(name, HOST, Date.now());
    updateLobby(room.code, { type: 'updateSettings', by: HOST.id, patch: { visibility: 'public' } });
    updateLobby(room.code, { type: 'addBot', by: HOST.id, level: 'grade_1' });
    updateLobby(room.code, { type: 'join', person: { id: 'Yuji', name: 'Yuji', avatar: null }, spectate: false });
    const bot = storedLobby(room.code)!.participants.find((p) => p.kind === 'bot')!;
    updateLobby(room.code, { type: 'kick', by: HOST.id, id: bot.id });
    expect(left).not.toHaveBeenCalled();
    updateLobby(room.code, { type: 'kick', by: HOST.id, id: 'Yuji' });
    expect(left).toHaveBeenCalledWith(room.code, 'Yuji');
    updateLobby(room.code, { type: 'leave', id: HOST.id });
    expect(left).toHaveBeenCalledWith(room.code, HOST.id);
  });
});
