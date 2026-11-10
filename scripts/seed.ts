// Données de démonstration (TECH-04) : comptes, historique de courses, carte de chaleur du clavier et personnages.
// Lancement : `npm run db:seed` (après `npm run db:migrate`). Idempotent : les comptes de démonstration sont
// supprimés puis recréés (cascade sur leurs résultats et statistiques) ; les autres comptes ne sont jamais touchés.
// Déterministe : le hasard vient du PRNG seedé du jeu, deux exécutions produisent les mêmes données
// (seules les dates suivent le jour de l'exécution).
//
// Les passages réels du domaine public (CONF-03, src/game/text/passageSeeds.ts) vont dans la table `passages`, vidée puis
// remplie à chaque exécution ; le serveur les lit en base et les garde en mémoire (src/lib/passages.ts), si bien que la
// génération du texte reste pure et instantanée (TXT-4). La liste de mots et les phrases de secours (src/game/text/corpus.ts)
// restent versionnées avec le code : le générateur s'en sert quand la base n'a pas de passage.
import { hash } from '@node-rs/argon2';
import { drizzle } from 'drizzle-orm/node-postgres';
import { inArray } from 'drizzle-orm';
import { Pool } from 'pg';
import { CHARACTERS } from '../src/components/shared/characters';
import { characterStats, keyStats, passages, results, users } from '../src/db/schema';
import { levelForXp, raceXp } from '../src/game/levels';
import { hashSeed, randomStream } from '../src/game/random';
import { SENTENCES, WORDS } from '../src/game/text/corpus';
import { PASSAGE_SEEDS } from '../src/game/text/passageSeeds';
import { passageComplexity } from '../src/game/text/passages';

/** Compte de démonstration documenté dans le README. */
export const DEMO_ACCOUNT = { username: 'demo', password: 'curse-typer-demo' } as const;

interface Persona {
  username: string;
  displayName: string;
  country: string | null;
  /** MPM net au début et à la fin de l'historique : la courbe de progression du profil (STAT-2, STAT-4). */
  wpm: [number, number];
  /** Précision moyenne, en pourcentage. */
  accuracy: number;
  races: number;
  github?: string;
  discord?: string;
}

const PERSONAS: readonly Persona[] = [
  { username: DEMO_ACCOUNT.username, displayName: 'Compte démo', country: 'CA', wpm: [38, 61], accuracy: 94, races: 48, github: 'https://github.com/curse-typer' },
  { username: 'kenji_t', displayName: 'Kenji', country: 'CA', wpm: [72, 96], accuracy: 97, races: 64, discord: 'kenji_t' },
  { username: 'lea-b', displayName: 'Léa B.', country: 'CA', wpm: [55, 78], accuracy: 96, races: 52 },
  { username: 'mathis_r', displayName: 'Mathis', country: 'CA', wpm: [41, 52], accuracy: 91, races: 30 },
  { username: 'zoe_w', displayName: 'Zoé', country: 'CA', wpm: [60, 84], accuracy: 95, races: 41 },
  { username: 'noah_g', displayName: 'Noah G.', country: 'FR', wpm: [33, 47], accuracy: 89, races: 26 },
  { username: 'amira_k', displayName: 'Amira', country: 'CA', wpm: [48, 70], accuracy: 95, races: 37 },
  { username: 'felix-d', displayName: 'Félix', country: 'BE', wpm: [85, 104], accuracy: 98, races: 58 },
  { username: 'chloe_p', displayName: 'Chloé', country: 'CA', wpm: [27, 39], accuracy: 90, races: 19 },
  { username: 'sam_l', displayName: 'Sam', country: 'US', wpm: [65, 73], accuracy: 93, races: 33 },
  { username: 'ines_m', displayName: 'Inès M.', country: 'CA', wpm: [44, 66], accuracy: 96, races: 28 },
  { username: 'olivier_c', displayName: 'Olivier', country: null, wpm: [22, 35], accuracy: 87, races: 15 },
];

/** Historique réparti sur les 60 derniers jours. */
const HISTORY_DAYS = 60;
const DAY_MS = 86_400_000;

/** Caractères de la carte de chaleur (src/components/profile/keyboard.ts), Maj compris. */
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const HEATMAP_CHARS = [...LOWER, ...LOWER.toUpperCase(), ...'1234567890-=[];\',./!@#$%^&*()_+{}:"<>?', ' '];
/** Touches de la rangée de repos et voyelles : plus rapides et plus sûres que les touches excentrées. */
const EASY = new Set([...'asdfjkl eiotn']);
const HARD = new Set([...'qzxpbvy[]\\;\'/-=']);

type Random = ReturnType<typeof randomStream>;

const between = (random: Random, min: number, max: number) => min + (max - min) * random.next();
const round1 = (n: number) => Math.round(n * 10) / 10;

function raceRows(persona: Persona, userId: number, random: Random, now: number) {
  const rows: (typeof results.$inferInsert)[] = [];
  const characters = new Map<string, { games: number; wins: number }>();
  let xp = 0;

  for (let i = 0; i < persona.races; i++) {
    const progress = persona.races === 1 ? 1 : i / (persona.races - 1);
    const [from, to] = persona.wpm;
    const wpm = round1(Math.max(10, from + (to - from) * progress + between(random, -6, 6)));
    const accuracy = round1(Math.min(100, Math.max(70, persona.accuracy + between(random, -4, 3))));
    const words = 25 + random.int(36);
    const durationSeconds = Math.max(5, Math.round((words * 60) / wpm));
    const keystrokes = Math.round((words * 5) / (accuracy / 100));
    const errors = keystrokes - Math.round(keystrokes * (accuracy / 100));
    const players = 2 + random.int(9);
    const rivals = 1 + random.int(Math.max(1, players - 1));
    // Les meilleurs finissent plus souvent devant.
    const strength = Math.min(1, wpm / 110);
    const rank = Math.min(players, 1 + Math.floor(random.next() * players * (1.1 - strength)));
    // Courses de plus en plus rapprochées, à des heures de cours ou de soirée.
    const day = HISTORY_DAYS * (1 - progress) ** 1.3;
    const createdAt = new Date(now - day * DAY_MS - between(random, 0, 0.4) * DAY_MS);

    rows.push({ userId, wpm, accuracy, durationSeconds, rank, players, rivals, errors, keystrokes, createdAt });
    xp += raceXp({ wpm, accuracy: accuracy / 100, durationSeconds, rank, rivals, finished: true });

    // Environ deux courses sur trois se jouent avec bonus, donc avec un personnage.
    if (random.next() < 0.66) {
      const character = random.pick(CHARACTERS).id;
      const entry = characters.get(character) ?? { games: 0, wins: 0 };
      characters.set(character, { games: entry.games + 1, wins: entry.wins + (rank === 1 ? 1 : 0) });
    }
  }
  return { rows, xp, characters };
}

function keyRows(persona: Persona, userId: number, random: Random): (typeof keyStats.$inferInsert)[] {
  const skill = persona.wpm[1];
  const baseMs = 12_000 / skill; // 60 000 ms ÷ (MPM × 5 caractères)
  const baseError = 100 - persona.accuracy;
  return HEATMAP_CHARS.map((char) => {
    const lower = char.toLowerCase();
    const shifted = char !== lower || /[!@#$%^&*()_+{}:"<>?]/.test(char);
    const difficulty = (EASY.has(lower) ? 0.75 : HARD.has(lower) ? 1.5 : 1) * (shifted ? 1.35 : 1) * (/\d/.test(char) ? 1.3 : 1);
    return {
      userId,
      char,
      errorRate: round1(Math.min(60, baseError * difficulty * between(random, 0.6, 1.5))),
      avgMs: Math.round(baseMs * difficulty * between(random, 0.85, 1.2)),
    };
  });
}

async function main() {
  try {
    process.loadEnvFile();
  } catch {
    // Pas de .env : DATABASE_URL vient de l'environnement (CI, Railway).
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquante (voir .env.example).');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  const now = Date.now();

  try {
    await db.transaction(async (tx) => {
      const keys = PERSONAS.map((p) => p.username.toLowerCase());
      await tx.delete(users).where(inArray(users.usernameKey, keys));

      for (const persona of PERSONAS) {
        const random = randomStream(hashSeed(`seed:${persona.username}`));
        const password = persona.username === DEMO_ACCOUNT.username ? DEMO_ACCOUNT.password : `${persona.username}-demo-pass`;
        const [user] = await tx
          .insert(users)
          .values({
            username: persona.username,
            usernameKey: persona.username.toLowerCase(),
            displayName: persona.displayName,
            passwordHash: await hash(password),
            country: persona.country,
            github: persona.github ?? '',
            discord: persona.discord ?? '',
            createdAt: new Date(now - (HISTORY_DAYS + 5) * DAY_MS),
          })
          .returning({ id: users.id });

        const { rows, xp, characters } = raceRows(persona, user.id, random, now);
        await tx.insert(results).values(rows);
        await tx.insert(keyStats).values(keyRows(persona, user.id, random));
        if (characters.size > 0) {
          await tx.insert(characterStats).values([...characters].map(([character, stat]) => ({ userId: user.id, character, ...stat })));
        }
        await tx.update(users).set({ xp, level: levelForXp(xp) }).where(inArray(users.id, [user.id]));
        console.log(`  ${persona.username.padEnd(10)} ${String(rows.length).padStart(3)} courses, ${xp} XP (${levelForXp(xp)})`);
      }
    });

    await db.transaction(async (tx) => {
      await tx.delete(passages);
      await tx.insert(passages).values(PASSAGE_SEEDS.map((seed) => ({ ...seed, complexity: passageComplexity(seed.text) })));
    });
    console.log(`${PASSAGE_SEEDS.length} passages du domaine public (FR + EN) dans la table passages.`);

    const total = PERSONAS.reduce((sum, p) => sum + p.races, 0);
    console.log(`\n${PERSONAS.length} comptes, ${total} courses.`);
    console.log(`Corpus de secours (src/game/text/corpus.ts) : ${WORDS.fr.length + WORDS.en.length} mots, ${SENTENCES.fr.length + SENTENCES.en.length} phrases (FR + EN).`);
    console.log(`Compte de démonstration : ${DEMO_ACCOUNT.username} / ${DEMO_ACCOUNT.password}`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
