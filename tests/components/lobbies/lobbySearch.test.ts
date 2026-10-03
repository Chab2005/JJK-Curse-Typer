import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOBBY_FILTERS,
  type LobbyFilters,
  type LobbySummary,
  activeFilterCount,
  filterLobbies,
  isJoinable,
  lobbyHref,
  lobbySearchQuery,
  parseLobbySearch,
  textCharsLabel,
} from '@/components/lobbies/lobbySearch';

const lobby = (overrides: Partial<LobbySummary>): LobbySummary => ({
  code: 'ABC-DEF',
  name: 'Shinjuku Showdown',
  host: 'John_Kaisen',
  players: 3,
  capacity: 8,
  bonus: true,
  languages: ['fr'],
  chars: ['uppercase'],
  words: 60,
  status: 'waiting',
  ...overrides,
});

const filters = (overrides: Partial<LobbyFilters>): LobbyFilters => ({ ...DEFAULT_LOBBY_FILTERS, ...overrides });

describe('isJoinable', () => {
  it('accepte un lobby en attente avec une place libre', () => {
    expect(isJoinable(lobby({ players: 7, capacity: 8 }))).toBe(true);
  });

  it('refuse un lobby complet', () => {
    expect(isJoinable(lobby({ players: 8, capacity: 8 }))).toBe(false);
  });

  it('refuse un lobby dont la course a commencé', () => {
    expect(isJoinable(lobby({ status: 'racing' }))).toBe(false);
  });
});

describe('lobbyHref', () => {
  it('mène au lobby pour le rejoindre', () => {
    expect(lobbyHref(lobby({ code: 'K7Q-H2M' }))).toBe('/lobby/K7Q-H2M');
  });

  it('mène au lobby en spectateur quand il est complet ou en course', () => {
    expect(lobbyHref(lobby({ code: 'K7Q-H2M', status: 'racing' }))).toBe('/lobby/K7Q-H2M?spectate=1');
  });
});

describe('filterLobbies', () => {
  const open = lobby({ code: 'OPN-001', host: 'Satoru_Infinity', name: 'Domaine Infini' });
  const full = lobby({ code: 'FUL-002', players: 8, capacity: 8 });
  const racing = lobby({ code: 'RUN-003', status: 'racing' });
  const noBonus = lobby({ code: 'NOB-004', bonus: false });
  const english = lobby({ code: 'ENG-005', languages: ['en'] });
  const both = lobby({ code: 'BTH-006', languages: ['fr', 'en'] });
  const punctuation = lobby({ code: 'PCT-007', chars: ['uppercase', 'punctuation'] });
  const all = [open, full, racing, noBonus, english, both, punctuation];
  const codes = (list: LobbySummary[]) => list.map((l) => l.code);

  it('cache par défaut les lobbies complets ou en course', () => {
    expect(codes(filterLobbies(all, DEFAULT_LOBBY_FILTERS))).toEqual(['OPN-001', 'NOB-004', 'ENG-005', 'BTH-006', 'PCT-007']);
  });

  it('montre les lobbies complets ou en course avec le filtre dédié', () => {
    expect(codes(filterLobbies(all, filters({ showUnavailable: true })))).toEqual(codes(all));
  });

  it('cherche dans le nom de l’hôte ou du lobby, sans tenir compte de la casse', () => {
    expect(codes(filterLobbies(all, filters({ query: 'satoru' })))).toEqual(['OPN-001']);
    expect(codes(filterLobbies(all, filters({ query: '  INFINI ' })))).toEqual(['OPN-001']);
  });

  it('ne garde que les lobbies avec bonus', () => {
    expect(codes(filterLobbies(all, filters({ bonusOnly: true })))).not.toContain('NOB-004');
  });

  it('garde un lobby dont au moins une langue est cochée', () => {
    expect(codes(filterLobbies(all, filters({ languages: ['en'] })))).toEqual(['ENG-005', 'BTH-006']);
  });

  it('n’affiche rien si aucune langue n’est cochée', () => {
    expect(filterLobbies(all, filters({ languages: [] }))).toEqual([]);
  });

  it('cache un lobby qui utilise un type de caractère décoché', () => {
    expect(codes(filterLobbies(all, filters({ chars: ['uppercase', 'digits', 'accents'] })))).not.toContain('PCT-007');
  });
});

describe('activeFilterCount', () => {
  it('vaut 0 avec les filtres par défaut, même avec une recherche', () => {
    expect(activeFilterCount(filters({ query: 'gojo' }))).toBe(0);
  });

  it('compte chaque groupe de filtres modifié', () => {
    expect(activeFilterCount(filters({ showUnavailable: true, bonusOnly: true, languages: ['fr'], chars: [] }))).toBe(4);
  });
});

describe('parseLobbySearch et lobbySearchQuery', () => {
  it('donne les filtres par défaut et la page 1 sans paramètre', () => {
    expect(parseLobbySearch(new URLSearchParams())).toEqual({ filters: DEFAULT_LOBBY_FILTERS, page: 1 });
  });

  it('n’écrit aucun paramètre pour les valeurs par défaut', () => {
    expect(lobbySearchQuery(DEFAULT_LOBBY_FILTERS, 1)).toBe('');
  });

  it('écrit seulement ce qui diffère des valeurs par défaut', () => {
    expect(lobbySearchQuery(filters({ query: 'gojo', bonusOnly: true, languages: ['en'] }), 2)).toBe('q=gojo&bonus=1&langs=en&page=2');
  });

  it('relit exactement ce qu’il a écrit', () => {
    const state = filters({ query: 'Black Flash', showUnavailable: true, bonusOnly: true, languages: [], chars: ['digits', 'accents'] });
    expect(parseLobbySearch(new URLSearchParams(lobbySearchQuery(state, 3)))).toEqual({ filters: state, page: 3 });
  });

  it('ignore les langues et caractères inconnus', () => {
    const { filters: parsed } = parseLobbySearch(new URLSearchParams('langs=fr,de&chars=digits,emoji'));
    expect(parsed.languages).toEqual(['fr']);
    expect(parsed.chars).toEqual(['digits']);
  });
});

describe('textCharsLabel', () => {
  it('affiche les minuscules seules par défaut', () => {
    expect(textCharsLabel([])).toBe('a-z');
  });

  it('affiche chaque type de caractère dans un ordre fixe', () => {
    expect(textCharsLabel(['accents', 'punctuation', 'digits', 'uppercase'])).toBe('a-Z 0-9 #$% àé');
  });
});
