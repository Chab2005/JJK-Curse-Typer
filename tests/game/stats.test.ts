import { describe, expect, it } from 'vitest';
import { averageScore, errorsPer100Words, summarizeGames, type GameRecord } from '@/game/stats';

describe('averageScore', () => {
  it('fait la moyenne des 5 dernières parties (les plus récentes en fin de liste)', () => {
    expect(averageScore([100, 900, 1000, 1100, 1200, 1300, 1400])).toBe(1200);
  });

  it('fait la moyenne de toutes les parties s’il y en a moins de 5', () => {
    expect(averageScore([1000, 2000])).toBe(1500);
  });

  it('arrondit à l’entier le plus proche', () => {
    expect(averageScore([1000, 1001, 1001])).toBe(1001);
  });

  it('renvoie null sans aucune partie', () => {
    expect(averageScore([])).toBeNull();
  });
});

describe('errorsPer100Words', () => {
  it('ramène les erreurs à 100 mots tapés', () => {
    expect(errorsPer100Words(12, 400)).toBe(3);
  });

  it('vaut 0 sans aucun mot tapé', () => {
    expect(errorsPer100Words(0, 0)).toBe(0);
  });
});

describe('summarizeGames', () => {
  const game = (wpm: number, extra: Partial<GameRecord> = {}): GameRecord => ({ wpm, accuracy: 0.9, errors: 2, keystrokes: 100, rank: 2, players: 3, at: '2026-10-01T00:00:00.000Z', ...extra });

  it('résume les parties d’un compte : meilleur MPM, moyennes, victoires (STAT-2)', () => {
    const summary = summarizeGames([game(40, { rank: 1 }), game(60, { accuracy: 1, errors: 0 }), game(50, { rank: 1, players: 1 })])!;
    expect(summary).toMatchObject({ games: 3, wins: 1, bestWpm: 60, wpm: 50, averageScore: 50 });
    expect(summary.accuracy).toBeCloseTo(2.8 / 3);
    // 4 erreurs pour 300 frappes, soit 60 mots.
    expect(summary.errorsPer100).toBeCloseTo((4 / 60) * 100);
  });

  it('prend le score moyen sur les 5 dernières parties seulement', () => {
    expect(summarizeGames([10, 100, 100, 100, 100, 100].map((wpm) => game(wpm)))!.averageScore).toBe(100);
  });

  it('accepte les anciennes parties sans rang ni frappes', () => {
    expect(summarizeGames([game(40, { rank: null, players: null, errors: 0, keystrokes: 0 })])).toMatchObject({ games: 1, wins: 0, errorsPer100: 0 });
  });

  it('renvoie null sans aucune partie', () => {
    expect(summarizeGames([])).toBeNull();
  });
});
