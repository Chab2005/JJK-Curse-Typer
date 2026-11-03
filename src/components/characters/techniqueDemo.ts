import type { CharacterId } from '@/components/shared/characters';

// Exemple en course d'une technique, sous sa carte sur la fiche du personnage (/characters/<id>) : une piste miniature
// où le personnage lance sa technique, en trois temps. Les textes viennent des messages (Character.example.<personnage>).
/** Personnages dont la technique a un exemple, et clés de leurs messages (Character.example.<personnage>). */
export type ExampleCharacter = 'todo' | 'yuji' | 'nobara';

/** Personnages dont la vitrine passe d'une capacité à l'autre, et ces capacités dans l'ordre affiché. */
export const SHOWCASE_ABILITIES = {
  yuji: ['blackFlash', 'divergentFist'],
  nobara: ['resonance', 'hairpin'],
} as const;
export type ShowcaseCharacter = keyof typeof SHOWCASE_ABILITIES;
export type ShowcaseAbility<C extends ShowcaseCharacter = ShowcaseCharacter> = (typeof SHOWCASE_ABILITIES)[C][number];
export type YujiExampleAbility = ShowcaseAbility<'yuji'>;
export type NobaraExampleAbility = ShowcaseAbility<'nobara'>;

export function hasShowcase(id: CharacterId): id is ShowcaseCharacter {
  return id in SHOWCASE_ABILITIES;
}

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

/** Les deux exemples commencent avec le lanceur en retrait du meneur. */
const TECHNIQUE_EXAMPLES: Record<ExampleCharacter, TechniqueExample> = {
  todo: { rival: 'yuji', you: 0.26, ahead: 0.7 },
  yuji: { rival: 'todo', you: 0.26, ahead: 0.7 },
  nobara: { rival: 'yuji', you: 0.26, ahead: 0.7 },
};

/** Avancée du rival une fois touché : étourdi, il reste sur place ; l'Épingle rallonge son texte et le fait reculer. */
const RIVAL_SHIFT: Record<ShowcaseAbility, number> = { blackFlash: 0, divergentFist: 0.04, resonance: 0, hairpin: -0.1 };

export function hasTechniqueExample(id: CharacterId): id is ExampleCharacter {
  return id in TECHNIQUE_EXAMPLES;
}

export function nextPhase(phase: ExamplePhase): ExamplePhase {
  return EXAMPLE_PHASES[(EXAMPLE_PHASES.indexOf(phase) + 1) % EXAMPLE_PHASES.length];
}

/** Todo échange les places ; Yuji et Nobara rattrapent un rival étourdi, ralenti ou rallongé (BON-1, UI-8). */
export function exampleRunners(character: ExampleCharacter, phase: ExamplePhase, ability: ShowcaseAbility = character === 'nobara' ? 'resonance' : 'blackFlash'): ExampleRunner[] {
  const example = TECHNIQUE_EXAMPLES[character];
  const after = phase === 'after';
  const youAfter = character === 'todo' ? example.ahead : 0.5;
  const rivalAfter = character === 'todo' ? example.you : example.ahead + RIVAL_SHIFT[ability];
  return [
    { id: 'you', character, x: after ? youAfter : example.you },
    { id: 'rival', character: example.rival, x: after ? rivalAfter : example.ahead },
  ];
}
