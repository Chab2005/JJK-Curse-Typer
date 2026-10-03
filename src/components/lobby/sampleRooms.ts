import { SAMPLE_PLAYERS } from '@/components/leaderboard/samplePlayers';
import { isJoinable } from '@/components/lobbies/lobbySearch';
import { SAMPLE_LOBBIES } from '@/components/lobbies/sampleLobbies';
import { normalizePin } from '@/components/home/join';
import { BOT_LEVELS, type HumanParticipant, type LobbyRoom, type Participant, type Spectator } from './lobbyRoom';

// Salons de démonstration en attendant la room temps réel (phase 2).
// Construits sans hasard à partir des lobbies publics de démonstration, pour un rendu stable.

const avatarOf = (name: string) => SAMPLE_PLAYERS.find((p) => p.username === name)?.avatar ?? null;
const person = (name: string) => ({ id: name, name, avatar: avatarOf(name) });

/**
 * Salon du lobby `code` vu par `viewer` : il le rejoint s'il est joignable, sinon (ou avec
 * `spectate`) il le regarde en spectateur. `null` si aucun lobby n'a ce code.
 */
export function findSampleRoom(code: string, viewer: string, spectate: boolean): LobbyRoom | null {
  const lobby = SAMPLE_LOBBIES.find((l) => l.code === normalizePin(code));
  if (!lobby) return null;

  const names = SAMPLE_PLAYERS.map((p) => p.username).filter((name) => name !== lobby.host && name !== viewer);
  let nextName = 0;
  const takeName = () => names[nextName++] ?? `Exorcist_${nextName}`;

  const host: HumanParticipant = { kind: 'human', ...person(lobby.host), ready: true };
  const participants: Participant[] = [host];
  for (let slot = 1; slot < lobby.players; slot++) {
    // Un participant sur quatre est un bot ; un humain sur trois n'est pas encore prêt.
    if (slot % 4 === 0) {
      const number = slot / 4;
      participants.push({ kind: 'bot', id: `bot-${number}`, level: BOT_LEVELS[number % BOT_LEVELS.length], number });
    } else {
      participants.push({ kind: 'human', ...person(takeName()), ready: slot % 3 !== 1 });
    }
  }

  const spectators: Spectator[] = [person(takeName())];
  if (lobby.status === 'racing') spectators.push(person(takeName()));

  if (viewer !== lobby.host) {
    if (!spectate && isJoinable(lobby)) participants.push({ kind: 'human', ...person(viewer), ready: false });
    else spectators.push(person(viewer));
  }

  return {
    code: lobby.code,
    name: lobby.name,
    status: lobby.status,
    hostId: lobby.host,
    participants,
    spectators,
    settings: {
      languages: lobby.languages,
      content: lobby.chars.includes('punctuation') ? 'sentences' : 'words',
      words: lobby.words,
      chars: lobby.chars,
      practice: '',
      timer: lobby.words > 100 ? 180 : 0,
      errorMode: 'accumulate',
      bonus: lobby.bonus,
      capacity: lobby.capacity,
      visibility: 'public',
    },
  };
}
