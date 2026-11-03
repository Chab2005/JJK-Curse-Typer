import type { CharacterId } from '@/components/shared/characters';

// Exemple en course d'une technique, sous sa carte sur la fiche du personnage (/characters/<id>) : une piste miniature
// où le personnage lance sa technique, en trois temps. Les textes viennent des messages (Character.example.<personnage>).
/** Personnages dont la technique a un exemple, et clés de leurs messages (Character.example.<personnage>). */
export type ExampleCharacter = 'todo';

export type ExamplePhase = 'before' | 'cast' | 'after';

export const EXAMPLE_PHASES: readonly ExamplePhase[] = ['before', 'cast', 'after'];

/** Durée de chaque temps de la démonstration, en ms. */
export const EXAMPLE_MS: Record<ExamplePhase, number> = { before: 2400, cast: 1800, after: 3200 };

export type ExampleRunner = {
  id: 'you' | 'rival';
  character: CharacterId;
  /** Avancement dans la course, de 0 (départ) à 1 (arrivée). */
  x: number;
};

type TechniqueExample = { rival: CharacterId; you: number; ahead: number };

/** Boogie-Woogie : Todo, en retrait, échange sa place avec le meneur. */
const TECHNIQUE_EXAMPLES: Record<ExampleCharacter, TechniqueExample> = {
  todo: { rival: 'yuji', you: 0.26, ahead: 0.7 },
};

export function hasTechniqueExample(id: CharacterId): id is ExampleCharacter {
  return id in TECHNIQUE_EXAMPLES;
}

export function nextPhase(phase: ExamplePhase): ExamplePhase {
  return EXAMPLE_PHASES[(EXAMPLE_PHASES.indexOf(phase) + 1) % EXAMPLE_PHASES.length];
}

/** Les deux coureurs de la piste à ce temps : les places ne s'échangent qu'une fois la technique lancée. */
export function exampleRunners(character: ExampleCharacter, phase: ExamplePhase): ExampleRunner[] {
  const example = TECHNIQUE_EXAMPLES[character];
  const swapped = phase === 'after';
  return [
    { id: 'you', character, x: swapped ? example.ahead : example.you },
    { id: 'rival', character: example.rival, x: swapped ? example.you : example.ahead },
  ];
}
