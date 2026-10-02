// Logique pure de la recherche de lobbies publics (LOB-2) : filtres, état dans l'URL, libellés.
import { parsePage } from '@/lib/pagination';

export const TEXT_LANGUAGES = ['fr', 'en'] as const;
export type TextLanguage = (typeof TEXT_LANGUAGES)[number];

/** Types de caractères que l'hôte peut ajouter aux minuscules (TXT-3). */
export const CHAR_KINDS = ['uppercase', 'digits', 'punctuation', 'accents'] as const;
export type CharKind = (typeof CHAR_KINDS)[number];

export interface LobbySummary {
  code: string;
  name: string;
  host: string;
  players: number;
  capacity: number;
  bonus: boolean;
  languages: TextLanguage[];
  chars: CharKind[];
  words: number;
  status: 'waiting' | 'racing';
}

export interface LobbyFilters {
  /** Texte cherché dans le nom de l'hôte ou du lobby. */
  query: string;
  /** Montre aussi les lobbies complets ou en course (à regarder en spectateur). */
  showUnavailable: boolean;
  bonusOnly: boolean;
  /** Langues acceptées : un lobby passe s'il en partage au moins une. */
  languages: TextLanguage[];
  /** Types de caractères acceptés : un lobby passe s'il n'utilise que ceux-là. */
  chars: CharKind[];
}

export const DEFAULT_LOBBY_FILTERS: LobbyFilters = {
  query: '',
  showUnavailable: false,
  bonusOnly: false,
  languages: [...TEXT_LANGUAGES],
  chars: [...CHAR_KINDS],
};

/** Un lobby se rejoint comme participant s'il attend encore et a une place libre. */
export function isJoinable(lobby: LobbySummary): boolean {
  return lobby.status === 'waiting' && lobby.players < lobby.capacity;
}

/** Lien vers le lobby : en participant s'il est joignable, sinon en spectateur. */
export function lobbyHref(lobby: LobbySummary): string {
  return isJoinable(lobby) ? `/lobby/${lobby.code}` : `/lobby/${lobby.code}?spectate=1`;
}

function matches(lobby: LobbySummary, filters: LobbyFilters, query: string): boolean {
  if (query && !lobby.host.toLowerCase().includes(query) && !lobby.name.toLowerCase().includes(query)) return false;
  if (!filters.showUnavailable && !isJoinable(lobby)) return false;
  if (filters.bonusOnly && !lobby.bonus) return false;
  if (!lobby.languages.some((language) => filters.languages.includes(language))) return false;
  return lobby.chars.every((kind) => filters.chars.includes(kind));
}

export function filterLobbies(lobbies: readonly LobbySummary[], filters: LobbyFilters): LobbySummary[] {
  const query = filters.query.trim().toLowerCase();
  return lobbies.filter((lobby) => matches(lobby, filters, query));
}

const sameSet = <T>(a: readonly T[], b: readonly T[]) => a.length === b.length && a.every((x) => b.includes(x));

/** Nombre de groupes de filtres qui diffèrent des valeurs par défaut (la recherche n'en est pas un). */
export function activeFilterCount(filters: LobbyFilters): number {
  return [
    filters.showUnavailable,
    filters.bonusOnly,
    !sameSet(filters.languages, TEXT_LANGUAGES),
    !sameSet(filters.chars, CHAR_KINDS),
  ].filter(Boolean).length;
}

/** Liste `a,b` lue dans l'URL, sans valeurs inconnues ; `fallback` si le paramètre est absent. */
function parseList<T extends string>(value: string | null, allowed: readonly T[], fallback: readonly T[]): T[] {
  if (value === null) return [...fallback];
  const wanted = value.split(',');
  return allowed.filter((item) => wanted.includes(item));
}

export function parseLobbySearch(params: Pick<URLSearchParams, 'get'>): { filters: LobbyFilters; page: number } {
  return {
    filters: {
      query: params.get('q') ?? '',
      showUnavailable: params.get('all') === '1',
      bonusOnly: params.get('bonus') === '1',
      languages: parseList(params.get('langs'), TEXT_LANGUAGES, TEXT_LANGUAGES),
      chars: parseList(params.get('chars'), CHAR_KINDS, CHAR_KINDS),
    },
    page: parsePage(params.get('page')),
  };
}

/** Paramètres d'URL (sans `?`) qui décrivent la recherche ; les valeurs par défaut sont omises. */
export function lobbySearchQuery(filters: LobbyFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.query) params.set('q', filters.query);
  if (filters.showUnavailable) params.set('all', '1');
  if (filters.bonusOnly) params.set('bonus', '1');
  if (!sameSet(filters.languages, TEXT_LANGUAGES)) params.set('langs', TEXT_LANGUAGES.filter((l) => filters.languages.includes(l)).join(','));
  if (!sameSet(filters.chars, CHAR_KINDS)) params.set('chars', CHAR_KINDS.filter((c) => filters.chars.includes(c)).join(','));
  if (page > 1) params.set('page', String(page));
  return params.toString().replaceAll('%2C', ',');
}

const CHAR_LABELS: Record<Exclude<CharKind, 'uppercase'>, string> = { digits: '0-9', punctuation: '#$%', accents: 'àé' };

/** Résumé court des caractères du texte, ex. `a-Z 0-9 #$%` (colonne « Type de texte »). */
export function textCharsLabel(chars: readonly CharKind[]): string {
  const base = chars.includes('uppercase') ? 'a-Z' : 'a-z';
  const extras = (['digits', 'punctuation', 'accents'] as const).filter((kind) => chars.includes(kind)).map((kind) => CHAR_LABELS[kind]);
  return [base, ...extras].join(' ');
}
