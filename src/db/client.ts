// Connexion Postgres sans `server-only` : la room de course (server.ts) l'importe hors de Next pour écrire les résultats.
// Le pool vit sur globalThis : Next et la room, chargés par deux chargeurs de modules, partagent ainsi les mêmes
// connexions, et il survit au rechargement à chaud. Il naît au premier appel : server.ts charge la room avant que
// Next ait lu `.env`. Le code de Next passe par `@/db`.
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pool?: Pool };

export function getDb() {
  globalForDb.pool ??= new Pool({ connectionString: process.env.DATABASE_URL });
  return drizzle(globalForDb.pool, { schema });
}
