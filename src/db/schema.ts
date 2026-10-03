import { index, integer, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  wpm: real("wpm").notNull(),
  accuracy: real("accuracy").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});




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
