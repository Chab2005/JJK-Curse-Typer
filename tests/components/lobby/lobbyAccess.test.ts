import { describe, expect, it } from 'vitest';
import { canCopyCode, canInvite, clientIp, type Invite, inviteDecision, inviteLinkMode, inviteUrl, isInviteToken, isListed, lobbySummary, needsInvite } from '@/components/lobby/lobbyAccess';
import type { LobbyRoom, LobbySettings, LobbyVisibility } from '@/components/lobby/lobbyRoom';

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

const room = (visibility: LobbyVisibility, overrides: Partial<LobbyRoom> = {}): LobbyRoom => ({
  code: 'ABC-DEF',
  name: 'Shinjuku Showdown',
  status: 'waiting',
  hostId: 'Gojo',
  participants: [
    { kind: 'human', id: 'Gojo', name: 'Gojo', avatar: 'gojo', ready: true },
    { kind: 'human', id: 'Yuji', name: 'Yuji', avatar: null, ready: false },
    { kind: 'bot', id: 'bot-1', level: 'grade_1', number: 1 },
  ],
  spectators: [{ id: 'Ijichi', name: 'Ijichi', avatar: null }],
  settings: { ...SETTINGS, visibility },
  ...overrides,
});

const invite = (overrides: Partial<Invite> = {}): Invite => ({ lobbyCode: 'ABC-DEF', claimedIp: null, revoked: false, ...overrides });

describe('needsInvite (LOB-1, LOB-3, LOB-4)', () => {
  it('ouvre les lobbies publics et à code à tout le monde', () => {
    expect(needsInvite(room('public'), 'Nobara')).toBe(false);
    expect(needsInvite(room('code'), 'Nobara')).toBe(false);
  });

  it('demande un lien d’invitation pour entrer dans un lobby privé', () => {
    expect(needsInvite(room('private'), 'Nobara')).toBe(true);
  });

  it('laisse entrer l’hôte, les participants et les spectateurs déjà là', () => {
    expect(needsInvite(room('private'), 'Gojo')).toBe(false);
    expect(needsInvite(room('private'), 'Yuji')).toBe(false);
    expect(needsInvite(room('private'), 'Ijichi')).toBe(false);
  });
});

describe('canInvite', () => {
  it('réserve les liens d’invitation à l’hôte d’un lobby privé ou à code', () => {
    expect(canInvite(room('private'), 'Gojo')).toBe(true);
    expect(canInvite(room('code'), 'Gojo')).toBe(true);
    expect(canInvite(room('private'), 'Yuji')).toBe(false);
  });

  it('n’en crée pas pour un lobby public, ouvert à tous', () => {
    expect(canInvite(room('public'), 'Gojo')).toBe(false);
  });
});

describe('inviteLinkMode', () => {
  it('ne donne de lien qu’à l’hôte, quel que soit l’accès', () => {
    expect(inviteLinkMode('public', false)).toBe('hostOnly');
    expect(inviteLinkMode('code', false)).toBe('hostOnly');
    expect(inviteLinkMode('private', false)).toBe('hostOnly');
  });

  it('donne à l’hôte l’adresse du lobby public et des liens à usage unique sinon', () => {
    expect(inviteLinkMode('public', true)).toBe('url');
    expect(inviteLinkMode('code', true)).toBe('oneTime');
    expect(inviteLinkMode('private', true)).toBe('oneTime');
  });
});

describe('canCopyCode (LOB-3)', () => {
  it('montre le code sauf dans un lobby privé', () => {
    expect(canCopyCode('public')).toBe(true);
    expect(canCopyCode('code')).toBe(true);
    expect(canCopyCode('private')).toBe(false);
  });
});

describe('isListed (LOB-2)', () => {
  it('ne liste que les lobbies publics', () => {
    expect(isListed(room('public'))).toBe(true);
    expect(isListed(room('code'))).toBe(false);
    expect(isListed(room('private'))).toBe(false);
  });
});

describe('inviteDecision', () => {
  it('attribue un lien neuf à la première IP qui l’ouvre', () => {
    expect(inviteDecision(invite(), 'ABC-DEF', '1.2.3.4')).toBe('claim');
  });

  it('laisse revenir la même IP, refuse toutes les autres', () => {
    const claimed = invite({ claimedIp: '1.2.3.4' });
    expect(inviteDecision(claimed, 'ABC-DEF', '1.2.3.4')).toBe('allow');
    expect(inviteDecision(claimed, 'ABC-DEF', '5.6.7.8')).toBe('deny');
  });

  it('refuse un lien inconnu, d’un autre lobby ou révoqué par une expulsion', () => {
    expect(inviteDecision(null, 'ABC-DEF', '1.2.3.4')).toBe('deny');
    expect(inviteDecision(invite({ lobbyCode: 'XYZ-XYZ' }), 'ABC-DEF', '1.2.3.4')).toBe('deny');
    expect(inviteDecision(invite({ claimedIp: '1.2.3.4', revoked: true }), 'ABC-DEF', '1.2.3.4')).toBe('deny');
  });

  it('refuse d’attribuer un lien sans IP connue', () => {
    expect(inviteDecision(invite(), 'ABC-DEF', null)).toBe('deny');
  });
});

describe('isInviteToken', () => {
  it('accepte un jeton base64url de 22 caractères', () => {
    expect(isInviteToken('abcdefghijklmnopqrstu_')).toBe(true);
    expect(isInviteToken('Ab-9Ab-9Ab-9Ab-9Ab-9Ab')).toBe(true);
  });

  it('rejette tout le reste', () => {
    expect(isInviteToken('short')).toBe(false);
    expect(isInviteToken('abcdefghijklmnopqrstu!')).toBe(false);
    expect(isInviteToken(['abcdefghijklmnopqrstu_'])).toBe(false);
    expect(isInviteToken(undefined)).toBe(false);
  });
});

describe('clientIp', () => {
  const headers = (values: Record<string, string>) => new Headers(values);

  it('préfère X-Real-IP, posé par le proxy de Railway', () => {
    expect(clientIp(headers({ 'x-real-ip': '1.2.3.4', 'x-forwarded-for': '9.9.9.9' }))).toBe('1.2.3.4');
  });

  it('retombe sur la première adresse de X-Forwarded-For', () => {
    expect(clientIp(headers({ 'x-forwarded-for': ' 1.2.3.4 , 10.0.0.1' }))).toBe('1.2.3.4');
  });

  it('renvoie null sans adresse', () => {
    expect(clientIp(headers({}))).toBeNull();
  });
});

describe('inviteUrl', () => {
  it('ajoute le jeton à l’adresse du lobby', () => {
    expect(inviteUrl('https://monkey-type.foo/lobby/ABC-DEF', 'tok')).toBe('https://monkey-type.foo/lobby/ABC-DEF?invite=tok');
  });
});

describe('lobbySummary', () => {
  it('résume le lobby pour la liste des lobbies publics', () => {
    expect(lobbySummary(room('public'))).toEqual({
      code: 'ABC-DEF',
      name: 'Shinjuku Showdown',
      host: 'Gojo',
      players: 3,
      capacity: 4,
      bonus: true,
      languages: ['fr'],
      chars: ['uppercase'],
      words: 60,
      status: 'waiting',
    });
  });
});
