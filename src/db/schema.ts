import { boolean, customType, index, integer, jsonb, pgTable, primaryKey, real, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { BotLevel } from "../game/bots";
import type { RacerStatus } from "../game/race";
import type { MissedKey } from "../game/series";
import type { Level } from "../game/levels";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

// Comptes (AUTH-2, AUTH-4) : aucun courriel, même transmis par un fournisseur OAuth (AUTH-3).
// `username` est l'identifiant (3 à 20 caractères, unique sans tenir compte de la casse via `usernameKey`) ;
// `displayName` est le nom montré sur le profil et en course, modifiable et non unique.
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  usernameKey: text("username_key").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  country: text("country"),
  /** Liens de profil facultatifs (PROF-4) : lien GitHub complet, nom ou lien Discord. Chaîne vide : aucun. */
  github: text("github").default("").notNull(),
  discord: text("discord").default("").notNull(),
  /** Photo téléversée (PROF-5), déjà redimensionnée en WebP ; `null` : initiales. */
  avatar: bytea("avatar"),
  avatarVersion: integer("avatar_version").default(0).notNull(),
  /** Expérience totale cumulée (STAT-9). */
  xp: integer("xp").default(0).notNull(),
  /** Grade atteint, toujours égal à `levelForXp(xp)` (voir `src/game/levels.ts`). */
  level: text("level").$type<Level>().default("grade_4").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    provider: text("provider").notNull(),
    providerUserId: text("provider_user_id").notNull(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerUserId] })],
);

// Sessions persistantes jusqu'à la déconnexion (AUTH-8) ; on ne garde que le hash du jeton.
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
});

// Identité OAuth validée mais sans compte : l'utilisateur doit encore choisir pseudo et mot de passe (AUTH-4).
export const oauthPending = pgTable("oauth_pending", {
  tokenHash: text("token_hash").primaryKey(),
  provider: text("provider").notNull(),
  providerUserId: text("provider_user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Tentatives de connexion échouées, par compte ou par IP (AUTH-7).
export const loginAttempts = pgTable("login_attempts", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: timestamp("window_start").notNull(),
});

// Une course finie d'un lobby créé (HIST-01, HIST-02) : de quoi réafficher sa page de résultats complète. Écrite en fin
// de course par la room avec ses participants, seulement si au moins un compte y a couru (les invités n'ont pas d'historique).
export const races = pgTable("races", {
  id: serial("id").primaryKey(),
  lobbyCode: text("lobby_code").notNull(),
  /** Texte de départ, avant les mots ajoutés ou retirés par les capacités. */
  text: text("text").notNull(),
  /** Réglages du lobby au départ (langue, longueur, mode d'erreur, timer…), tels qu'au moment de la course. */
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull(),
  /** Départ fixé par le serveur, après le décompte. */
  startedAt: timestamp("started_at").notNull(),
  finishedAt: timestamp("finished_at").notNull(),
  /** Participants, bots compris. */
  players: integer("players").notNull(),
});

// Chaque participant d'une course archivée, bots et invités compris, pour la réafficher. Les statistiques ne lisent jamais
// cette table (elles lisent `results`, sans bots) : les bots restent hors des statistiques (BOT-5).
export const raceParticipants = pgTable(
  "race_participants",
  {
    id: serial("id").primaryKey(),
    raceId: integer("race_id").notNull().references(() => races.id, { onDelete: "cascade" }),
    /** Compte du participant ; `null` pour un invité ou un bot. */
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    /** Siège de la course : nom d'utilisateur, `guest:<pseudo>` ou `bot-<n>`. */
    seatId: text("seat_id").notNull(),
    /** Nom affiché pendant la course ; le numéro pour un bot (traduit à l'affichage). */
    name: text("name").notNull(),
    /** `CharacterId` du personnage, `null` sans personnage. */
    avatar: text("avatar"),
    isBot: boolean("is_bot").notNull(),
    botLevel: text("bot_level").$type<BotLevel>(),
    rank: integer("rank").notNull(),
    wpm: real("wpm").notNull(),
    rawWpm: real("raw_wpm").notNull(),
    /** Précision en pourcentage, de 0 à 100. */
    accuracy: real("accuracy").notNull(),
    errors: integer("errors").notNull(),
    /** Temps de course à l'arrivée, en ms ; `null` s'il n'a pas fini. */
    endedAtMs: integer("ended_at_ms"),
    status: text("status").$type<RacerStatus>().notNull(),
    /** Effets de techniques reçus (RES-02). */
    received: integer("received").notNull(),
    /** MPM net à chaque seconde (RES-03). */
    series: jsonb("series").$type<number[]>().notNull(),
    /** Fautes et frappes par touche attendue (RES-03). */
    missedKeys: jsonb("missed_keys").$type<MissedKey[]>().notNull(),
  },
  (table) => [uniqueIndex("race_participants_race_seat_idx").on(table.raceId, table.seatId), index("race_participants_user_id_idx").on(table.userId)],
);

// Une course finie par un compte (STAT-8), écrite par la room de course ou rattachée d'un invité (STAT-7). Bots exclus (BOT-5).
export const results = pgTable(
  "results",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    /** MPM net (H-21). */
    wpm: real("wpm").notNull(),
    /** Précision en pourcentage, de 0 à 100. */
    accuracy: real("accuracy").notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    /** Rang et nombre de participants (bots compris) ; `null` pour une course enregistrée avant leur ajout. */
    rank: integer("rank"),
    players: integer("players"),
    /** Autres comptes de la course ; seules les courses qui en ont comptent au classement. `null` avant son ajout. */
    rivals: integer("rivals"),
    errors: integer("errors").default(0).notNull(),
    keystrokes: integer("keystrokes").default(0).notNull(),
    /** Détail de la course (RES-05), `null` pour une course enregistrée avant leur ajout. MPM brut, toutes frappes comprises. */
    rawWpm: real("raw_wpm"),
    /** `finished` ou `timeout`. */
    status: text("status"),
    /** Effets de techniques reçus. */
    received: integer("received"),
    /** MPM net à chaque seconde de course : de quoi redessiner la courbe. */
    series: jsonb("series").$type<number[]>(),
    /** Fautes par touche attendue : de quoi redessiner les touches ratées. */
    missedKeys: jsonb("missed_keys").$type<Record<string, number>>(),
    /** Course archivée (HIST-02) ; `null` pour une course d'avant l'archivage, ou rattachée d'un invité. */
    raceId: integer("race_id").references(() => races.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("results_user_id_idx").on(table.userId), index("results_race_id_idx").on(table.raceId)],
);

// Heatmap du clavier QWERTY, une ligne par compte et par caractère. Aucun historique : après chaque course,
// valeur stockée = (valeur stockée + valeur de la course) / 2 ; un caractère absent de la course n'est pas touché.
export const keyStats = pgTable(
  "key_stats",
  {
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    /** Un seul caractère tel que tapé : 'a', ';', ' '. */
    char: text("char").notNull(),
    /** Taux d'erreur en pourcentage, de 0 à 100. */
    errorRate: real("error_rate").notNull(),
    /** Temps moyen pour taper ce caractère, en millisecondes. */
    avgMs: real("avg_ms").notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.char] })],
);

// Personnage joué par un compte dans une course avec bonus, une ligne par compte et par personnage. Aucun historique :
// chaque course ajoute 1 à `games`, et 1 à `wins` si le joueur est premier des humains. Taux de victoire = wins / games.
export const characterStats = pgTable(
  "character_stats",
  {
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    /** `CharacterId` : 'gojo', 'sukuna'… */
    character: text("character").notNull(),
    games: integer("games").default(0).notNull(),
    wins: integer("wins").default(0).notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.character] })],
);



// Liens d'invitation à usage unique des lobbies privés ou à code (LOB-4) : le lien appartient à la
// première IP qui l'ouvre. Les lobbies vivent en mémoire, d'où un code sans clé étrangère.
export const lobbyInvites = pgTable(
  "lobby_invites",
  {
    token: text("token").primaryKey(),
    lobbyCode: text("lobby_code").notNull(),
    claimedIp: text("claimed_ip"),
    /** Visiteur qui a ouvert le lien : l'expulser révoque le lien (LOB-8). */
    claimedBy: text("claimed_by"),
    /** Nom affiché de ce visiteur au moment où il a ouvert le lien, montré à l'hôte. */
    claimedName: text("claimed_name"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    claimedAt: timestamp("claimed_at"),
    revokedAt: timestamp("revoked_at"),
  },
  (table) => [index("lobby_invites_lobby_code_idx").on(table.lobbyCode)],
);

// Le lobby où se trouve chaque visiteur, compte (nom d'utilisateur) ou invité (`guest:<nom>`) : la clé primaire garantit
// qu'il n'est que dans un seul lobby à la fois (SALLE-06). Les lobbies vivent en mémoire, d'où un code sans clé étrangère ;
// la ligne tombe quand il quitte le lobby ou quand le lobby se ferme.
export const roomMembers = pgTable(
  "room_members",
  {
    viewerId: text("viewer_id").primaryKey(),
    lobbyCode: text("lobby_code").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [index("room_members_lobby_code_idx").on(table.lobbyCode)],
);

// Passages réels du domaine public pour le texte « cohérent » (CONF-03), remplis par `npm run db:seed`. Le serveur les lit
// une fois et les garde en mémoire (src/lib/passages.ts) : la génération du texte reste pure et ne touche jamais la base.
export const passages = pgTable(
  "passages",
  {
    id: serial("id").primaryKey(),
    /** `TextLanguage` : 'en', 'fr'. */
    language: text("language").notNull(),
    /** 1 facile, 2 moyen, 3 difficile (`passageComplexity`). */
    complexity: integer("complexity").notNull(),
    text: text("text").notNull(),
    /** Auteur, œuvre et année. */
    source: text("source").notNull(),
  },
  (table) => [index("passages_language_idx").on(table.language)],
);
