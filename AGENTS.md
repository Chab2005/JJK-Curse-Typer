# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, Cursor…) when working with code in this repository.

## Project

Multiplayer typing-race game (MonkeyType-like), school project (Web V). Requirements live outside the repo in `../Cahier des charges - 3.md`; requirement IDs (GEN, AUTH, PROF, LOB, RACE, TXT, BOT, BON, STAT, UI, TECH, QA) and hypotheses (H-*) from it are referenced throughout `PLAN.md` and should be referenced in code/commits too. `PLAN.md` is the roadmap (in French): target architecture, data model, realtime protocol and phased checklist. Read it before starting feature work.



## Commands

```bash
docker compose up -d      # local Postgres 17 on :5432 (db "monkeytyper")
cp .env.example .env      # DATABASE_URL for local Postgres
npm run dev               # Next.js dev server on :3000
npm run build
npm run lint              # ESLint 9 flat config (next core-web-vitals + typescript)
npx tsc --noEmit          # typecheck (no script for it)

npm run db:generate       # drizzle-kit: generate SQL migration from src/db/schema.ts into drizzle/
npm run db:migrate        # apply migrations
npm run db:push           # push schema directly (dev only)
npm run db:studio
```

`GET /api/health` runs `select 1` against the DB. It's a quick way to check the DB connection.

No test runner is set up yet. The plan calls for Vitest (unit, mainly `src/game/`) and Playwright (E2E, multi-tab races).

## Stack notes

- **Next.js 16 App Router, React 19, React Compiler on** (`reactCompiler: true`), Tailwind CSS 4 (CSS-first config via `@theme` in `src/app/globals.css`, no `tailwind.config`). Next 16 has breaking changes from older versions (e.g. global `LayoutProps<"/">` / `PageProps` types). The docs matching the installed version are in `node_modules/next/dist/docs/`, so check there rather than relying on memory.
- Path alias `@/*` → `src/*`.
- **DB**: Drizzle ORM + `pg`. `src/db/index.ts` is `server-only` and caches the `Pool` on `globalThis` in dev to survive HMR. Import `db` from `@/db` only in server code (route handlers, server components, server actions). Schema in `src/db/schema.ts`; the current `users`/`results` tables are a placeholder to be replaced by the model in PLAN.md §2. Commit generated migrations in `drizzle/`.
- Deployed on Vercel (pushes to `main` go to prod). Postgres on Neon in prod.

## Target architecture (from PLAN.md, mostly not built yet)

- **Realtime runs outside Vercel**: PartyKit / PartyServer (Cloudflare Durable Objects) in `party/`. One room per lobby holds authoritative state (countdown, keystroke validation, bots, bonuses, timers via alarms), plus one index room that lists public lobbies. Rooms broadcast an aggregated 5 Hz `tick`. Lobby state is **never** stored in Postgres. At race end the room POSTs signed results to `/api/races/complete`.
- **Pure, shared game logic in `src/game/`**: reducers (`state + event → new state`) with no I/O, imported by both the client (instant local feedback) and the room (server truth / anti-cheat replay of keystrokes). This is a core course requirement (functional programming). Keep I/O, React and network code out of `src/game/`.
- Planned libs: `zod` for WS message and form validation, custom DB sessions + `@node-rs/argon2` + `arctic` (Discord/GitHub OAuth, no email stored), `next-intl` (FR/EN), `next-themes`.

## UI / design

- `templates/*.html` are static design mockups (Tailwind CDN, French UI copy). Their inline `tailwind.config` defines the design tokens: Material-style colors (`surface`, `on-surface`, `primary-container`…), spacing (`space-sm`, `space-md`, `margin`, `gutter`…) and type scales (`headline-sm`, `display-hero`, `label-code`, `typing-stream`…), using Space Grotesk / JetBrains Mono / Fondamento.
- `src/components/` are React ports of those mockups and use those token class names, split by page (`home/`) or shared (`layout/`). The tokens are ported into Tailwind 4 `@theme` in `src/app/globals.css`, with fonts loaded via `next/font` in `src/app/layout.tsx`. The home page (`src/app/page.tsx`) is built from `templates/index.html`.
- UI copy is currently French. FR/EN i18n is a requirement (GEN-3).


## Code requirement

- Separate the code into components under page specific folders, like `*/components/game/textinput.tsx`. 
- Before making a `feat`, make the `tests` for its logic
- When prompt to make a `feat`, ask questions about vague zones and undefined behaviour
- After making a `feat`, run the test made for it
- You can make commits


## Commits convention

### Cans and can't 

#### Can

- Commit
- merge local branch into `dev`
- make local branch from `dev`

#### Can't

- Push code to GitHub
- merge local branch into `main`
- make local branch from `main`
- add yourself as a contributor in the repo



### Suffix

- feat     : a feature
- fix      : fixing  bugs
- chore    : edit file configuration
- docs     : updating README.md
- refactor : when a method has its inside change, but not its core logic
- test     : making test

### Commit message formats 

- A commit always need to have a suffix
- A commit always need to have a message
- A commit is always understandable by a junior dev
- Never does a commit have a description
- At best, a commit has 15 words max

Ex: 
    `{SUFFIX}` : `{MESSAGE}`

    feat : implement X thing

#### Feat

- A feature always explains what it is implementing
- A commit for a feature always start with implement

Ex: 
    feat : implement `{REST OF MSG}`

#### Fix

- A fix always explain what it's fixing

Ex :
    fix : X thing was doing Y unwanted result
    fix : doing X action was doing Y unwanted result

#### Chore

- A chore always tell what file it has changed
- A chore always give a small explanation of what changed

Ex : 
    chore : edit dockerfile to add PHP version 8.5

#### Docs

- A docs commit always tell what file it has changed
- A docs commit always give a small explanation of what changed

Ex : 
    docs : add to `README.md` dev build steps

#### Refactor

- A `refactor` commit always say what method it has changed
- A `refactor` commit always say what file the change was

Ex : 
    refactor : change foo in X.file







