import { describe, expect, it } from 'vitest';
import {
  type LobbyRoom,
  type LobbySettings,
  MAX_CAPACITY,
  WORDS_MAX,
  WORDS_MIN,
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
    let next = lobbyReducer(room(), { type: 'addBot', by: 'Gojo', level: 'expert' });
    next = lobbyReducer(next, { type: 'addBot', by: 'Gojo', level: 'beginner' });
    expect(next.participants.slice(2)).toEqual([
      { kind: 'bot', id: 'bot-1', level: 'expert', number: 1 },
      { kind: 'bot', id: 'bot-2', level: 'beginner', number: 2 },
    ]);
  });

  it("ne dépasse pas la capacité", () => {
    const full = room({ settings: { ...SETTINGS, capacity: 2 } });
    expect(lobbyReducer(full, { type: 'addBot', by: 'Gojo', level: 'expert' })).toBe(full);
  });

  it("est réservé à l'hôte", () => {
    const before = room();
    expect(lobbyReducer(before, { type: 'addBot', by: 'Yuji', level: 'expert' })).toBe(before);
  });
});

describe('kick (LOB-8)', () => {
  it('retire un participant, un bot ou un spectateur', () => {
    const withBot = lobbyReducer(room(), { type: 'addBot', by: 'Gojo', level: 'intermediate' });
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
    const withBot = lobbyReducer(room(), { type: 'addBot', by: 'Gojo', level: 'expert' });
    expect(lobbyReducer(withBot, { type: 'transferHost', by: 'Gojo', id: 'bot-1' })).toBe(withBot);
    expect(lobbyReducer(withBot, { type: 'transferHost', by: 'Gojo', id: 'Ijichi' })).toBe(withBot);
  });
});

describe('course en cours', () => {
  it("fige le salon d'attente", () => {
    const racing = room({ status: 'racing' });
    expect(lobbyReducer(racing, { type: 'setReady', id: 'Yuji', ready: true })).toBe(racing);
    expect(lobbyReducer(racing, { type: 'addBot', by: 'Gojo', level: 'expert' })).toBe(racing);
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
    const withBot = lobbyReducer(room({ participants: [human('Gojo')] }), { type: 'addBot', by: 'Gojo', level: 'beginner' });
    expect(startBlocker(withBot)).toBeNull();
  });
});

describe('readyCount', () => {
  it("compte l'hôte et les bots comme prêts", () => {
    const withBot = lobbyReducer(room(), { type: 'addBot', by: 'Gojo', level: 'beginner' });
    expect(readyCount(withBot)).toBe(2);
  });
});
