import { customType, index, integer, pgTable, primaryKey, real, serial, text, timestamp } from "drizzle-orm/pg-core";

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
    errors: integer("errors").default(0).notNull(),
    keystrokes: integer("keystrokes").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("results_user_id_idx").on(table.userId)],
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
    createdAt: timestamp("created_at").defaultNow().notNull(),
    claimedAt: timestamp("claimed_at"),
    revokedAt: timestamp("revoked_at"),
  },
  (table) => [index("lobby_invites_lobby_code_idx").on(table.lobbyCode)],
);
