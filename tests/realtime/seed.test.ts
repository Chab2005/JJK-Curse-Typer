import { beforeEach, describe, expect, it, vi } from 'vitest';
import { COUNTDOWN_MS } from '@/game/race';
import { SAMPLE_CURRENT_USER } from '@/lib/sampleUser';
import { clearLobbies, createLobby, storedLobby, updateLobby } from '@/lib/lobbies';
import { authSecret } from '@/lib/auth/secret';
import { seatTicket } from '@/realtime/ticket';
import { raceFromLobby } from '@/realtime/seed';

const passages = vi.hoisted(() => ({ cached: undefined as unknown[] | undefined, load: vi.fn(async () => []) }));
vi.mock('@/lib/passages', () => ({ cachedPassages: () => passages.cached, loadPassages: passages.load }));

beforeEach(() => {
  passages.cached = undefined;
  passages.load.mockClear();
});

describe('raceFromLobby passages (CONF-03)', () => {
  const lobby = () => {
    clearLobbies();
    const room = createLobby((host) => host, { id: 'Gojo', name: 'Gojo', avatar: null }, Date.now());
    updateLobby(room.code, { type: 'addBot', by: 'Gojo', level: 'grade_1' });
    updateLobby(room.code, { type: 'updateSettings', by: 'Gojo', patch: { content: 'sentences', languages: ['en'], chars: ['uppercase', 'punctuation'], words: 6 } });
    updateLobby(room.code, { type: 'start', by: 'Gojo' });
    return room.code;
  };

  it('builds the text from the cached database passages', () => {
    passages.cached = [{ id: 1, language: 'en', complexity: 1, text: 'Zebras gallop quietly across the frozen savannah.', source: 'Test, One (1900)' }];
    expect(raceFromLobby(lobby(), 1000)!.race.text).toMatch(/^Zebras gallop/);
  });

  it('starts at once without them, falls back to the bundled corpus and asks to load them for the next race', () => {
    const { race } = raceFromLobby(lobby(), 1000)!;
    expect(race.text.length).toBeGreaterThan(0);
    expect(race.text).not.toMatch(/Zebras/);
    expect(passages.load).toHaveBeenCalled();
  });
});

describe('raceFromLobby', () => {
  it('prépare la course du lobby : sièges, texte et réglages de l’hôte', () => {
    const seeded = raceFromLobby('TKY-HGH', 1000)!;
    expect(seeded.race.phase).toBe('countdown');
    expect(seeded.race.startAt).toBe(1000 + COUNTDOWN_MS);
    expect(seeded.race.bonus).toBe(true);
    expect(seeded.race.text.split(' ')).toHaveLength(150);
    expect(seeded.race.racers).toHaveLength(8);
    expect(seeded.preferredSeat).toBe(SAMPLE_CURRENT_USER);
  });

  it('garde les bots comme sièges de bot, avec leur niveau et leur numéro', () => {
    const { race } = raceFromLobby('TKY-HGH', 1000)!;
    const bot = race.racers.find((r) => r.seat.kind === 'bot')!;
    expect(bot.seat).toMatchObject({ id: 'bot-1', name: '1', level: expect.any(String) });
  });

  it('tire un nouveau texte à chaque course', () => {
    expect(raceFromLobby('TKY-HGH', 1000)!.race.text).not.toBe(raceFromLobby('TKY-HGH', 2000)!.race.text);
  });

  it('prépare aussi la course d’un lobby créé, avec ses bots et ses réglages', () => {
    clearLobbies();
    const lobby = createLobby((host) => host, { id: SAMPLE_CURRENT_USER, name: SAMPLE_CURRENT_USER, avatar: 'megumi' }, Date.now());
    updateLobby(lobby.code, { type: 'addBot', by: SAMPLE_CURRENT_USER, level: 'grade_4' });
    updateLobby(lobby.code, { type: 'updateSettings', by: SAMPLE_CURRENT_USER, patch: { words: 20, gameMode: 'normal' } });
    updateLobby(lobby.code, { type: 'start', by: SAMPLE_CURRENT_USER });

    const { race, preferredSeat } = raceFromLobby(lobby.code, 2000)!;
    expect(race.racers.map((r) => r.seat.id)).toEqual([SAMPLE_CURRENT_USER, 'bot-1']);
    expect(race.text.split(' ')).toHaveLength(20);
    expect(race.bonus).toBe(true);
    expect(preferredSeat).toBe(SAMPLE_CURRENT_USER);
  });

  it('n’ajoute pas l’utilisateur de démonstration à un lobby créé par un vrai compte', () => {
    clearLobbies();
    const lobby = createLobby((host) => host, { id: 'chab', name: 'Chab', avatar: 'yuji' }, Date.now());
    updateLobby(lobby.code, { type: 'addBot', by: 'chab', level: 'grade_4' });
    updateLobby(lobby.code, { type: 'start', by: 'chab' });

    const { race, preferredSeat } = raceFromLobby(lobby.code, 2000)!;
    expect(race.racers.map((r) => r.seat.id)).toEqual(['chab', 'bot-1']);
    expect(preferredSeat).toBe('chab');
  });

  it('donne à chaque joueur sa photo téléversée, jamais aux bots (PROF-5)', () => {
    clearLobbies();
    const lobby = createLobby((host) => host, { id: 'chab', name: 'Chab', avatar: null, photo: '/api/avatar/chab?v=3' }, Date.now());
    updateLobby(lobby.code, { type: 'addBot', by: 'chab', level: 'grade_4' });
    updateLobby(lobby.code, { type: 'start', by: 'chab' });

    const { race } = raceFromLobby(lobby.code, 2000)!;
    expect(race.racers.map((r) => r.seat.photo)).toEqual(['/api/avatar/chab?v=3', undefined]);
  });

  it('ne prépare la course d’un lobby créé qu’une fois lancée par l’hôte', () => {
    clearLobbies();
    const lobby = createLobby((host) => host, { id: 'chab', name: 'Chab', avatar: null }, Date.now());
    updateLobby(lobby.code, { type: 'addBot', by: 'chab', level: 'grade_4' });
    expect(raceFromLobby(lobby.code, 2000)).toBeNull();
  });

  it('place chacun d’après son ticket et passe en résultats à la fin de la course', () => {
    clearLobbies();
    const lobby = createLobby((host) => host, { id: 'chab', name: 'Chab', avatar: null }, Date.now());
    updateLobby(lobby.code, { type: 'addBot', by: 'chab', level: 'grade_4' });
    updateLobby(lobby.code, { type: 'start', by: 'chab' });

    const seeded = raceFromLobby(lobby.code, 2000)!;
    expect(seeded.ticketSeat?.(seatTicket(lobby.code, 'chab', authSecret()))).toBe('chab');
    expect(seeded.ticketSeat?.(undefined)).toBeNull();

    seeded.onEnd?.();
    expect(storedLobby(lobby.code)?.status).toBe('results');
    // Revenir au salon ne le rouvre plus : seul l’hôte relance (COURSE-11).
    updateLobby(lobby.code, { type: 'join', person: { id: 'chab', name: 'Chab', avatar: null }, spectate: false });
    expect(storedLobby(lobby.code)?.status).toBe('results');
    updateLobby(lobby.code, { type: 'restart', by: 'chab' });
    expect(storedLobby(lobby.code)?.status).toBe('waiting');
  });

  it('accepte un code en minuscules et refuse un lobby inconnu', () => {
    expect(raceFromLobby('tky-hgh', 1000)).not.toBeNull();
    expect(raceFromLobby('ZZZ-ZZZ', 1000)).toBeNull();
  });
});
