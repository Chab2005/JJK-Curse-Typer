import { describe, expect, it } from 'vitest';
import type { GameRecord } from '@/game/stats';
import {
  playerFromGames,
  type PlayerStats,
  leaderboardQuery,
  leaderboardView,
  parseLeaderboardSearch,
  rankPlayers,
} from '@/components/leaderboard/leaderboard';

const player = (username: string, overrides: Partial<PlayerStats> = {}): PlayerStats => ({
  username,
  avatar: null,
  games: 10,
  wpm: 100,
  accuracy: 0.95,
  averageScore: 1000,
  errorsPer100: 3,
  ...overrides,
});

const names = (list: { username: string }[]) => list.map((p) => p.username);

describe('rankPlayers', () => {
  const players = [
    player('Lent', { wpm: 80, accuracy: 0.99, errorsPer100: 1 }),
    player('Rapide', { wpm: 150, accuracy: 0.9, errorsPer100: 6 }),
    player('Moyen', { wpm: 110, accuracy: 0.97, errorsPer100: 2 }),
  ];

  it('classe du plus grand au plus petit MPM', () => {
    expect(names(rankPlayers(players, 'wpm'))).toEqual(['Rapide', 'Moyen', 'Lent']);
  });

  it('classe les erreurs pour 100 mots du plus petit au plus grand', () => {
    expect(names(rankPlayers(players, 'errors'))).toEqual(['Lent', 'Moyen', 'Rapide']);
  });

  it('numérote les rangs à partir de 1', () => {
    expect(rankPlayers(players, 'accuracy').map((p) => p.rank)).toEqual([1, 2, 3]);
  });

  it('garde un joueur dès sa première partie classée, pas avant', () => {
    const ranked = names(rankPlayers([...players, player('Novice', { wpm: 200, games: 1 }), player('Absent', { wpm: 200, games: 0 })], 'wpm'));
    expect(ranked).toContain('Novice');
    expect(ranked).not.toContain('Absent');
  });

  it('départage une égalité avec les autres statistiques (MPM, précision, score, erreurs)', () => {
    const tied = [
      player('B', { wpm: 120, accuracy: 0.95 }),
      player('A', { wpm: 120, accuracy: 0.98 }),
      player('C', { wpm: 100, accuracy: 0.99 }),
    ];
    expect(names(rankPlayers(tied, 'wpm'))).toEqual(['A', 'B', 'C']);
    const sameAccuracy = [player('X', { accuracy: 0.97, wpm: 90 }), player('Y', { accuracy: 0.97, wpm: 130 })];
    expect(names(rankPlayers(sameAccuracy, 'accuracy'))).toEqual(['Y', 'X']);
  });

  it('départage une égalité parfaite par le nom, pour un ordre stable', () => {
    expect(names(rankPlayers([player('Zed'), player('Amy')], 'wpm'))).toEqual(['Amy', 'Zed']);
  });
});

describe('leaderboardView', () => {
  const ranked = rankPlayers(
    ['Gojo', 'Yuta', 'Maki', 'Renee', 'Nobara'].map((name, i) => player(name, { wpm: 200 - i * 10 })),
    'wpm',
  );

  it('met les trois premiers sur le podium et la suite dans le tableau', () => {
    const view = leaderboardView(ranked, '');
    expect(names(view.podium)).toEqual(['Gojo', 'Yuta', 'Maki']);
    expect(names(view.rows)).toEqual(['Renee', 'Nobara']);
  });

  it('cache le podium pendant une recherche et liste toutes les correspondances avec leur vrai rang', () => {
    const view = leaderboardView(ranked, ' o ');
    expect(view.podium).toEqual([]);
    expect(view.rows.map((p) => [p.username, p.rank])).toEqual([['Gojo', 1], ['Nobara', 5]]);
  });

  it('cherche sans tenir compte de la casse', () => {
    expect(names(leaderboardView(ranked, 'MAKI').rows)).toEqual(['Maki']);
  });
});

describe('parseLeaderboardSearch et leaderboardQuery', () => {
  it('trie par MPM par défaut', () => {
    expect(parseLeaderboardSearch(new URLSearchParams())).toEqual({ category: 'wpm', query: '', page: 1 });
  });

  it('ignore une catégorie inconnue', () => {
    expect(parseLeaderboardSearch(new URLSearchParams('by=speed')).category).toBe('wpm');
  });

  it('n’écrit aucun paramètre pour les valeurs par défaut', () => {
    expect(leaderboardQuery({ category: 'wpm', query: '' }, 1)).toBe('');
  });

  it('relit exactement ce qu’il a écrit', () => {
    const query = leaderboardQuery({ category: 'errors', query: 'nobara' }, 2);
    expect(query).toBe('q=nobara&by=errors&page=2');
    expect(parseLeaderboardSearch(new URLSearchParams(query))).toEqual({ category: 'errors', query: 'nobara', page: 2 });
  });
});

describe('playerFromGames', () => {
  const game = (wpm: number, rivals: number | null = 1): GameRecord => ({ wpm, accuracy: 0.95, errors: 1, keystrokes: 50, rank: 1, players: 2, rivals, at: '2026-10-01T00:00:00.000Z' });

  it('fait une ligne du classement à partir des parties d’un compte (STAT-8)', () => {
    expect(playerFromGames({ username: 'Yuji', photo: '/api/avatar/Yuji?v=1' }, [game(40), game(60)])).toEqual({
      username: 'Yuji',
      avatar: null,
      photo: '/api/avatar/Yuji?v=1',
      games: 2,
      wpm: 50,
      accuracy: 0.95,
      averageScore: 50,
      errorsPer100: 10,
    });
  });

  it('ne compte que les courses contre un autre compte', () => {
    const player = playerFromGames({ username: 'Yuji', photo: null }, [game(40), game(200, 0), game(150, null), game(60, 2)]);
    expect(player).toMatchObject({ games: 2, wpm: 50 });
  });

  it('renvoie null sans partie contre un autre compte', () => {
    expect(playerFromGames({ username: 'Yuji', photo: null }, [])).toBeNull();
    expect(playerFromGames({ username: 'Yuji', photo: null }, [game(40, 0), game(40, null)])).toBeNull();
  });
});
