// Course tirée d'un lobby (créé depuis l'accueil ou de démonstration) : les sièges, le texte et les réglages
// viennent du lobby, jamais du client. Un lobby créé n'a de course qu'une fois lancée par son hôte.
import { createRace, type RaceState, type RacerSeat } from '@/game/race';
import { hashSeed } from '@/game/random';
import { generateText } from '@/game/text/generate';
import { SAMPLE_CURRENT_USER } from '@/lib/sampleUser';
import { authSecret } from '@/lib/auth/secret';
import { findLobby, storedLobby, updateLobby } from '@/lib/lobbies';
import { readSeatTicket } from './ticket';

export interface SeededRace {
  race: RaceState;
  /** Siège donné en priorité au premier joueur connecté : l'hôte d'un lobby créé, l'utilisateur de démonstration sinon. */
  preferredSeat: string | null;
  /** Lobby créé : siège donné par le ticket du joueur (spectateur sans ticket). */
  ticketSeat?: (ticket: string | undefined) => string | null;
  /** Appelé une fois, quand la course est finie ou fermée : le lobby créé rouvre son salon. */
  onEnd?: () => void;
}

export function raceFromLobby(code: string, now: number): SeededRace | null {
  // Un lobby créé est pris tel quel : le voir au nom de l'utilisateur de démonstration lui ajouterait un siège fantôme,
  // que le premier onglet prendrait en laissant le sien à la simulation.
  const stored = storedLobby(code);
  if (stored && stored.status !== 'racing') return null;
  const lobby = stored ?? findLobby(code, SAMPLE_CURRENT_USER, false);
  if (!lobby) return null;
  const preferred = stored ? stored.hostId : SAMPLE_CURRENT_USER;

  const seats = lobby.participants.map((p): RacerSeat =>
    p.kind === 'human'
      ? { id: p.id, name: p.name, avatar: p.avatar, kind: 'human', level: null }
      : // Le nom d'un bot est son numéro : chaque écran le traduit (« Cadavre maudit 2 »).
        { id: p.id, name: String(p.number), avatar: null, kind: 'bot', level: p.level },
  );
  const { settings } = lobby;
  const seed = hashSeed(`${lobby.code}:${now}`);
  const text = generateText(
    { languages: settings.languages, content: settings.content, words: settings.words, chars: settings.chars, practice: settings.practice },
    seed,
  );

  return {
    race: createRace({ seats, text, mode: settings.errorMode, timerMs: settings.timer * 1000, bonus: settings.bonus, now, seed }),
    preferredSeat: seats.some((seat) => seat.id === preferred) ? preferred : null,
    ...(stored && {
      ticketSeat: (ticket: string | undefined) => readSeatTicket(ticket, stored.code, authSecret()),
      onEnd: () => void updateLobby(stored.code, { type: 'finish' }),
    }),
  };
}
