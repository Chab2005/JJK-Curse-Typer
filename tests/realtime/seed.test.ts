import { describe, expect, it } from 'vitest';
import { COUNTDOWN_MS } from '@/game/race';
import { SAMPLE_CURRENT_USER } from '@/lib/currentUser';
import { raceFromLobby } from '@/realtime/seed';

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

  it('accepte un code en minuscules et refuse un lobby inconnu', () => {
    expect(raceFromLobby('tky-hgh', 1000)).not.toBeNull();
    expect(raceFromLobby('ZZZ-ZZZ', 1000)).toBeNull();
  });
});
