// Course tirée d'un lobby (créé depuis l'accueil ou de démonstration), en attendant que le salon d'attente vive lui aussi
// sur le serveur : les sièges, le texte et les réglages viennent du lobby, jamais du client.
import { createRace, type RaceState, type RacerSeat } from '@/game/race';
import { hashSeed } from '@/game/random';
import { generateText } from '@/game/text/generate';
import { SAMPLE_CURRENT_USER } from '@/lib/sampleUser';
import { findLobby } from '@/lib/lobbies';

export interface SeededRace {
  race: RaceState;
  /** Siège donné en priorité au premier joueur connecté : celui de l'utilisateur de démonstration. */
  preferredSeat: string | null;
}

export function raceFromLobby(code: string, now: number): SeededRace | null {
  const lobby = findLobby(code, SAMPLE_CURRENT_USER, false);
  if (!lobby) return null;

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
    preferredSeat: seats.some((seat) => seat.id === SAMPLE_CURRENT_USER) ? SAMPLE_CURRENT_USER : null,
  };
}
