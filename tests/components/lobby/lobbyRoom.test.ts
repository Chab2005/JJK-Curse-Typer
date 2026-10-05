import { describe, expect, it } from 'vitest';
import {
  type LobbyRoom,
  type LobbySettings,
  MAX_CAPACITY,
  WORDS_MAX,
  WORDS_MIN,
  isEmpty,
  isSpectating,
  lobbyReducer,
  normalizePractice,
  readyCount,
  startBlocker,
  viewerRole,
} from '@/components/lobby/lobbyRoom';

const SETTINGS: LobbySettings = {
  languages: ['fr'],
  content: 'sentences',
  words: 60,
  chars: ['uppercase'],
  practice: '',
  timer: 0,
  errorMode: 'accumulate',
  bonus: true,
  capacity: 4,
  visibility: 'private',
};

const human = (id: string, ready = false) => ({ kind: 'human' as const, id, name: id, avatar: null, ready });

const room = (overrides: Partial<LobbyRoom> = {}): LobbyRoom => ({
  code: 'ABC-DEF',
  name: 'Shinjuku Showdown',
  status: 'waiting',
  hostId: 'Gojo',
  participants: [human('Gojo', true), human('Yuji')],
  spectators: [{ id: 'Ijichi', name: 'Ijichi', avatar: null }],
  settings: SETTINGS,
  ...overrides,
});

const ids = (r: LobbyRoom) => r.participants.map((p) => p.id);

describe('viewerRole', () => {
  it("reconnaît l'hôte, un participant et un spectateur", () => {
    expect(viewerRole(room(), 'Gojo')).toBe('host');
    expect(viewerRole(room(), 'Yuji')).toBe('player');
    expect(viewerRole(room(), 'Ijichi')).toBe('spectator');
    expect(viewerRole(room(), 'Inconnu')).toBe('spectator');
  });
});

describe('setReady (LOB-9)', () => {
  it("change l'état de préparation d'un humain", () => {
    const next = lobbyReducer(room(), { type: 'setReady', id: 'Yuji', ready: true });
    expect(next.participants[1]).toMatchObject({ id: 'Yuji', ready: true });
  });

  it('ignore un identifiant inconnu', () => {
    const before = room();
    expect(lobbyReducer(before, { type: 'setReady', id: 'Inconnu', ready: true })).toBe(before);
  });
});

describe('updateSettings (LOB-5)', () => {
  it("applique les changements de l'hôte", () => {
    const next = lobbyReducer(room(), { type: 'updateSettings', by: 'Gojo', patch: { bonus: false, errorMode: 'block' } });
    expect(next.settings).toMatchObject({ bonus: false, errorMode: 'block' });
  });

  it("ignore les changements d'un autre joueur", () => {
    const before = room();
    expect(lobbyReducer(before, { type: 'updateSettings', by: 'Yuji', patch: { bonus: false } })).toBe(before);
  });

  it('garde au moins une langue (TXT-1)', () => {
    const next = lobbyReducer(room(), { type: 'updateSettings', by: 'Gojo', patch: { languages: [] } });
    expect(next.settings.languages).toEqual(['fr']);
  });

  it('borne la longueur du texte (TXT-4)', () => {
    const update = (words: number) => lobbyReducer(room(), { type: 'updateSettings', by: 'Gojo', patch: { words } }).settings.words;
    expect(update(2)).toBe(WORDS_MIN);
    expect(update(5000)).toBe(WORDS_MAX);
    expect(update(42.6)).toBe(43);
  });

  it('borne la capacité entre le nombre de participants et 60 (LOB-6)', () => {
    const r = room({ participants: [human('Gojo'), human('Yuji'), human('Megumi')] });
    const update = (capacity: number) => lobbyReducer(r, { type: 'updateSettings', by: 'Gojo', patch: { capacity } }).settings.capacity;
    expect(update(1)).toBe(3);
    expect(update(500)).toBe(MAX_CAPACITY);
    expect(update(12)).toBe(12);
  });

  it('refuse un timer de plus de trois minutes (RACE-9)', () => {
    const next = lobbyReducer(room(), { type: 'updateSettings', by: 'Gojo', patch: { timer: 600 } });
    expect(next.settings.timer).toBe(0);
  });

  it("change l'accès au lobby (LOB-1)", () => {
    const next = lobbyReducer(room(), { type: 'updateSettings', by: 'Gojo', patch: { visibility: 'public' } });
    expect(next.settings.visibility).toBe('public');
  });

  it('garde l’accès courant si la valeur est inconnue', () => {
    const next = lobbyReducer(room(), { type: 'updateSettings', by: 'Gojo', patch: { visibility: 'secret' as never } });
    expect(next.settings.visibility).toBe('private');
  });

  it('nettoie les caractères à pratiquer (TXT-5)', () => {
    const next = lobbyReducer(room(), { type: 'updateSettings', by: 'Gojo', patch: { practice: ' z,z / .' } });
    expect(next.settings.practice).toBe('z,/.');
  });
});

describe('normalizePractice', () => {
  it('retire les espaces et les doublons, et garde 10 caractères au plus', () => {
    expect(normalizePractice('a a b')).toBe('ab');
    expect(normalizePractice('abcdefghijklmnop')).toBe('abcdefghij');
  });
});

describe('addBot (LOB-8)', () => {
  it('ajoute un bot du niveau choisi, numéroté à la suite', () => {
    let next = lobbyReducer(room(), { type: 'addBot', by: 'Gojo', level: 'grade_1' });
    next = lobbyReducer(next, { type: 'addBot', by: 'Gojo', level: 'grade_4' });
    expect(next.participants.slice(2)).toEqual([
      { kind: 'bot', id: 'bot-1', level: 'grade_1', number: 1 },
      { kind: 'bot', id: 'bot-2', level: 'grade_4', number: 2 },
    ]);
  });

  it("ne dépasse pas la capacité", () => {
    const full = room({ settings: { ...SETTINGS, capacity: 2 } });
    expect(lobbyReducer(full, { type: 'addBot', by: 'Gojo', level: 'grade_1' })).toBe(full);
  });

  it("est réservé à l'hôte", () => {
    const before = room();
    expect(lobbyReducer(before, { type: 'addBot', by: 'Yuji', level: 'grade_1' })).toBe(before);
  });
});

describe('kick (LOB-8)', () => {
  it('retire un participant, un bot ou un spectateur', () => {
    const withBot = lobbyReducer(room(), { type: 'addBot', by: 'Gojo', level: 'grade_2' });
    expect(ids(lobbyReducer(withBot, { type: 'kick', by: 'Gojo', id: 'Yuji' }))).toEqual(['Gojo', 'bot-1']);
    expect(ids(lobbyReducer(withBot, { type: 'kick', by: 'Gojo', id: 'bot-1' }))).toEqual(['Gojo', 'Yuji']);
    expect(lobbyReducer(withBot, { type: 'kick', by: 'Gojo', id: 'Ijichi' }).spectators).toEqual([]);
  });

  it("ne retire pas l'hôte et est réservé à l'hôte", () => {
    const before = room();
    expect(lobbyReducer(before, { type: 'kick', by: 'Gojo', id: 'Gojo' })).toBe(before);
    expect(lobbyReducer(before, { type: 'kick', by: 'Yuji', id: 'Gojo' })).toBe(before);
  });
});

describe('transferHost (LOB-11)', () => {
  it("donne le rôle d'hôte à un autre humain", () => {
    const next = lobbyReducer(room(), { type: 'transferHost', by: 'Gojo', id: 'Yuji' });
    expect(next.hostId).toBe('Yuji');
    expect(viewerRole(next, 'Gojo')).toBe('player');
    expect(next.participants[0]).toMatchObject({ id: 'Gojo', ready: false });
  });

  it("refuse un bot ou un spectateur comme hôte", () => {
    const withBot = lobbyReducer(room(), { type: 'addBot', by: 'Gojo', level: 'grade_1' });
    expect(lobbyReducer(withBot, { type: 'transferHost', by: 'Gojo', id: 'bot-1' })).toBe(withBot);
    expect(lobbyReducer(withBot, { type: 'transferHost', by: 'Gojo', id: 'Ijichi' })).toBe(withBot);
  });
});

describe('course en cours', () => {
  it("fige le salon d'attente", () => {
    const racing = room({ status: 'racing' });
    expect(lobbyReducer(racing, { type: 'setReady', id: 'Yuji', ready: true })).toBe(racing);
    expect(lobbyReducer(racing, { type: 'addBot', by: 'Gojo', level: 'grade_1' })).toBe(racing);
  });
});

describe('startBlocker (LOB-7)', () => {
  it('demande au moins deux participants', () => {
    expect(startBlocker(room({ participants: [human('Gojo', true)] }))).toBe('notEnoughPlayers');
  });

  it("attend que chaque humain autre que l'hôte soit prêt", () => {
    expect(startBlocker(room())).toBe('notReady');
    expect(startBlocker(room({ participants: [human('Gojo'), human('Yuji', true)] }))).toBeNull();
  });

  it("permet une course entre l'hôte et des bots (H-17)", () => {
    const withBot = lobbyReducer(room({ participants: [human('Gojo')] }), { type: 'addBot', by: 'Gojo', level: 'grade_4' });
    expect(startBlocker(withBot)).toBeNull();
  });
});

describe('readyCount', () => {
  it("compte l'hôte et les bots comme prêts", () => {
    const withBot = lobbyReducer(room(), { type: 'addBot', by: 'Gojo', level: 'grade_4' });
    expect(readyCount(withBot)).toBe(2);
  });
});

const person = (id: string) => ({ id, name: id, avatar: null });

describe('join', () => {
  it('fait entrer un nouveau venu comme participant pas encore prêt', () => {
    const next = lobbyReducer(room(), { type: 'join', person: person('Nobara'), spectate: false });
    expect(next.participants.at(-1)).toEqual({ kind: 'human', id: 'Nobara', name: 'Nobara', avatar: null, ready: false });
  });

  it('le met en spectateur s’il le demande, si le salon est plein ou si la course est partie', () => {
    expect(isSpectating(lobbyReducer(room(), { type: 'join', person: person('Nobara'), spectate: true }), 'Nobara')).toBe(true);
    const full = room({ settings: { ...SETTINGS, capacity: 2 } });
    expect(isSpectating(lobbyReducer(full, { type: 'join', person: person('Nobara'), spectate: false }), 'Nobara')).toBe(true);
    expect(isSpectating(lobbyReducer(room({ status: 'racing' }), { type: 'join', person: person('Nobara'), spectate: false }), 'Nobara')).toBe(true);
  });

  it('ne change rien pour quelqu’un déjà dans le salon', () => {
    const before = room();
    expect(lobbyReducer(before, { type: 'join', person: person('Yuji'), spectate: true })).toBe(before);
    expect(lobbyReducer(before, { type: 'join', person: person('Ijichi'), spectate: false })).toBe(before);
  });
});

describe('leave', () => {
  it('retire un participant ou un spectateur', () => {
    expect(ids(lobbyReducer(room(), { type: 'leave', id: 'Yuji' }))).toEqual(['Gojo']);
    expect(lobbyReducer(room(), { type: 'leave', id: 'Ijichi' }).spectators).toEqual([]);
  });

  it('passe le rôle d’hôte au plus ancien humain (H-18), même pendant la course', () => {
    const next = lobbyReducer(room({ status: 'racing' }), { type: 'leave', id: 'Gojo' });
    expect(next.hostId).toBe('Yuji');
    expect(ids(next)).toEqual(['Yuji']);
  });

  it('passe le rôle d’hôte à un spectateur s’il ne reste aucun joueur humain', () => {
    const next = lobbyReducer(room({ participants: [human('Gojo')] }), { type: 'leave', id: 'Gojo' });
    expect(next.hostId).toBe('Ijichi');
  });

  it('ignore quelqu’un qui n’est pas dans le salon', () => {
    const before = room();
    expect(lobbyReducer(before, { type: 'leave', id: 'Inconnu' })).toBe(before);
  });
});

describe('isEmpty', () => {
  it('est vrai quand il ne reste que des bots', () => {
    const withBot = lobbyReducer(room({ participants: [human('Gojo')], spectators: [] }), { type: 'addBot', by: 'Gojo', level: 'grade_1' });
    expect(isEmpty(withBot)).toBe(false);
    expect(isEmpty(lobbyReducer(withBot, { type: 'leave', id: 'Gojo' }))).toBe(true);
  });
});

describe('setSpectating', () => {
  it('fait passer un joueur en spectateur et inversement', () => {
    const watching = lobbyReducer(room({ participants: [human('Gojo', true), human('Yuji', true)] }), { type: 'setSpectating', id: 'Yuji', spectating: true });
    expect(ids(watching)).toEqual(['Gojo']);
    expect(watching.spectators.at(-1)).toEqual({ id: 'Yuji', name: 'Yuji', avatar: null });

    const back = lobbyReducer(watching, { type: 'setSpectating', id: 'Yuji', spectating: false });
    expect(back.participants.at(-1)).toMatchObject({ id: 'Yuji', ready: false });
    expect(isSpectating(back, 'Yuji')).toBe(false);
  });

  it('laisse l’hôte regarder sans perdre son rôle', () => {
    const next = lobbyReducer(room(), { type: 'setSpectating', id: 'Gojo', spectating: true });
    expect(next.hostId).toBe('Gojo');
    expect(viewerRole(next, 'Gojo')).toBe('host');
    expect(isSpectating(next, 'Gojo')).toBe(true);
  });

  it('ne fait pas rejoindre un salon plein ni une course partie', () => {
    const full = room({ settings: { ...SETTINGS, capacity: 2 } });
    expect(lobbyReducer(full, { type: 'setSpectating', id: 'Ijichi', spectating: false })).toBe(full);
    const racing = room({ status: 'racing' });
    expect(lobbyReducer(racing, { type: 'setSpectating', id: 'Yuji', spectating: true })).toBe(racing);
  });
});

describe('start / finish (LOB-7)', () => {
  const ready = room({ participants: [human('Gojo', true), human('Yuji', true)] });

  it("lance la course quand l'hôte le demande et que tout le monde est prêt", () => {
    expect(lobbyReducer(ready, { type: 'start', by: 'Gojo' }).status).toBe('racing');
    expect(lobbyReducer(ready, { type: 'start', by: 'Yuji' })).toBe(ready);
    const notReady = room();
    expect(lobbyReducer(notReady, { type: 'start', by: 'Gojo' })).toBe(notReady);
  });

  it("rouvre le salon après la course : chacun redit qu'il est prêt", () => {
    const racing = lobbyReducer(ready, { type: 'start', by: 'Gojo' });
    const next = lobbyReducer(racing, { type: 'finish' });
    expect(next.status).toBe('waiting');
    expect(next.participants[1]).toMatchObject({ id: 'Yuji', ready: false });
    expect(lobbyReducer(ready, { type: 'finish' })).toBe(ready);
  });
});
