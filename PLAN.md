# Plan de développement

Référence : `../Cahier des charges - 3.md` (identifiants d'exigences GEN, AUTH, LOB, RACE, TXT, BOT, BON, STAT, UI, TECH, QA).
Périmètre : **Essentiel + Souhaitable**. Le « Moins prioritaire » reste au backlog.

---

## 1. Architecture

```
 Navigateur ──HTTPS──▶ Next.js 16 (Vercel)  ──▶ Postgres (Neon, gratuit)
     │                   pages SSR, auth, stats,        ▲
     │                   API de fin de course ◀─────────┤ POST signé (secret partagé)
     │                                                  │
     └──WebSocket──▶ PartyKit / PartyServer (Cloudflare Durable Objects)
                      1 room = 1 lobby : état autoritaire, décompte,
                      validation des frappes, bots, bonus, timers
                      1 room « index » : liste des lobbies publics
```

### Pourquoi PartyKit (Cloudflare Durable Objects) comme service temps réel géré
Vercel ne garde pas de WebSocket ouvert. Parmi les services gérés :

| Service | Logique serveur (bots, timers, validation) | Quota gratuit à 60 joueurs × 5 Hz |
|---|---|---|
| Pusher / Ably / Supabase Realtime | Non : ils relaient seulement les messages, la logique retomberait sur des clients ou des fonctions serverless sans boucle | Quotas comptés par message livré : 60 × 60 × 5 ≈ 18 000/s, épuisés en quelques minutes |
| **PartyKit / Durable Objects** | **Oui : du code TypeScript tourne dans la room, avec alarmes pour les timers** | Messages WebSocket entrants facturés au 1/20, sortants non facturés : tient pour un projet scolaire |

> ⚠️ Vérifier les limites actuelles du plan gratuit Cloudflare Workers / Durable Objects au moment du spike (phase 0). Plan B : Ably + boucle de bots côté hôte (moins sûr contre la triche).

### Principe clé : logique de jeu pure et partagée
Le cours porte sur la programmation fonctionnelle : toute la logique métier vit dans `src/game/` sous forme de **fonctions pures** (réducteurs `état + événement → nouvel état`), sans I/O. Elle est importée **à la fois** par le client (affichage instantané) et par la room PartyKit (vérité serveur, RACE-14). Elle est donc testable unitairement sans mock (QA-1).

```
src/
  game/            # pur, partagé client + serveur
    text/          # génération (TXT-*), listes de mots, corpus filtré
    typing.ts      # réducteur de frappe, 2 modes d'erreur (RACE-7)
    scoring.ts     # MPM brut/net, précision, pénalités (RACE-8, H-21)
    keystats.ts    # stats par touche pour la carte de chaleur (STAT-3)
    race.ts        # réducteur de course : progression, meneur, dépassements, fin
    bots.ts        # profils et simulation (BOT-*), PRNG seedé
    bonus.ts       # attribution, puissance, effets (BON-*)
    protocol.ts    # types des messages client ↔ room (zod)
  app/             # Next.js (pages, server actions, route handlers)
  db/              # Drizzle : schéma, requêtes
  lib/auth/        # sessions, argon2, OAuth
party/
  lobby.ts         # room d'un lobby
  index.ts         # room d'index des lobbies publics
```

### Choix techniques
| Besoin | Choix | Exigences |
|---|---|---|
| Framework | Next.js 16 App Router, React 19, Tailwind 4 (déjà en place) | TECH-1, TECH-8 |
| BD | Postgres : Docker en local (déjà en place), **Neon** en prod ; Drizzle | TECH-2, TECH-4 |
| Temps réel | `partyserver` + `partysocket` sur Cloudflare | TECH-5, TECH-6, TECH-7 |
| Auth | Sessions maison en BD, `@node-rs/argon2`, `arctic` pour Discord/GitHub (aucun courriel requis, contrairement à Auth.js / Better Auth) | AUTH-* |
| i18n | `next-intl` (FR/EN) | GEN-3 |
| Thèmes | `next-themes` + tokens CSS | UI-1 |
| Validation | `zod` (messages WS et formulaires) | RACE-14 |
| Tests | Vitest (unitaires), Playwright (E2E, multi-onglets pour les courses) | QA-1, QA-2 |
| CI/CD | GitHub Actions : lint, typecheck, tests, E2E ; Vercel + `wrangler deploy` pour la room | QA-3, TECH-3 |

---

## 2. Modèle de données (Drizzle)

Remplace la table `results` actuelle.

| Table | Colonnes principales |
|---|---|
| `users` | id, username (unique), password_hash, avatar_id, locale, theme, race_prefs (jsonb), created_at |
| `oauth_accounts` | provider, provider_user_id, user_id — **pas de courriel** (AUTH-3) |
| `sessions` | id (hash du jeton), user_id, expires_at (AUTH-8) |
| `guests` | id (cookie), created_at, expires_at (STAT-6) |
| `races` | id, lobby_id, settings (jsonb), text, started_at, ended_at |
| `race_results` | race_id, user_id ∣ guest_id, rank, wpm_net, wpm_raw, accuracy, errors, duration_ms, status (fini/abandon/timer) — bots non persistés (BOT-5) |
| `key_stats` | user_id, key, hits, errors, total_latency_ms — agrégat mis à jour à chaque fin de course (STAT-3) |
| `login_attempts` | clé (username ou IP), compteur, fenêtre (AUTH-7) |

L'état des lobbies **ne va pas en BD** : il vit dans la room (Durable Object), qui envoie un POST signé à `/api/races/complete` en fin de course.

---

## 3. Protocole temps réel (résumé)

- **Client → room** : `join`, `ready`, `settings` (hôte), `start` (hôte), `keys` (frappes groupées avec horodatage, toutes les ~100–200 ms), `useBonus`, `abandon`, `kick`/`addBot`/`transferHost` (hôte).
- **Room → clients** : `lobbyState` (à la connexion et à la resynchro), `countdown` (heure de départ serveur, le client corrige son décalage d'horloge), `tick` **agrégé à 5 Hz** (progression de tous, meneur, événements de dépassement et de bonus — TECH-7), `results`.
- La room **rejoue les frappes** dans `game/typing.ts` : la progression affichée aux autres est celle calculée par le serveur (anti-triche, RACE-14). Le client affiche sa propre frappe localement sans attendre.
- Bots : simulés dans la room à chaque tick à partir de `game/bots.ts`.
- Timers : alarmes Durable Object pour le timer de course (RACE-9) et le timer d'inactivité de 10 min (RACE-12).

---

## 4. Phases

Chaque phase se termine par une démo déployée. ✅ = critère de sortie.

### Phase 0 — Fondations et réduction du risque
- [ ] Mettre à jour le cahier (v3) et envoyer Q-1 à Q-5 sur Discord
- [ ] **Spike temps réel** : room PartyKit minimale déployée ; script de charge avec 60 clients simulés à 5 Hz ; vérifier latence et quotas (TECH-4, TECH-6)
- [ ] Neon + variables Vercel ; migrations Drizzle en CI
- [ ] Vitest, Playwright, workflow GitHub Actions (QA-3)
- [ ] `next-intl`, `next-themes`, squelette de layout
- [ ] Brouillon de DA : nom, logo, palette testée pour le daltonisme, maquettes des écrans accueil / lobby / course / podium / tableau de bord (UI-2, UI-3, UI-4)
- ✅ 60 clients simulés dans une room sans dégradation ; CI verte ; DA validée

### Phase 1 — Moteur de jeu pur (`src/game/`)
- [ ] Génération de texte : listes FR/EN filtrées, mode phrases, mode mots aléatoires, ponctuation, accents inclus/interdits, longueur en mots, couverture du clavier, générateur seedé (TXT-1 à TXT-4, TXT-6, TXT-8, TXT-9)
- [ ] Réducteur de frappe, modes accumulation et blocage (RACE-7)
- [ ] Score : MPM brut/net, précision, pénalité ; test « martèlement < précis » (RACE-8)
- [ ] Stats par touche : latence et erreurs (STAT-3)
- [ ] Réducteur de course : progression, meneur, écart au poursuivant, dépassements, conditions de fin (RACE-2 à RACE-5, RACE-10)
- [ ] Bots : 3 niveaux, vitesse fluctuante, erreurs corrigées (BOT-1 à BOT-4)
- [ ] Page de course **locale** (vous + bots, sans réseau) pour itérer sur l'UX de frappe
- ✅ Couverture unitaire élevée de `src/game/` ; course locale jouable

### Phase 2 — Multijoueur temps réel
- [ ] Room lobby : join/leave, salon d'attente, prêt, paramètres hôte, capacité ≤ 60, ≥ 1 humain (LOB-5 à LOB-9)
- [ ] Décompte synchronisé, départ simultané (RACE-1)
- [ ] Frappes validées par le serveur, tick agrégé à 5 Hz (RACE-14, TECH-7)
- [ ] UI de course : pistes des participants, meneur mis en évidence, écart quand on mène, animations de dépassement, MPM et précision en direct (RACE-2 à RACE-6, GEN-4)
- [ ] Timer optionnel ≤ 3 min, abandon, écran d'attente après l'arrivée, podium et classement (RACE-9 à RACE-11, RACE-14)
- [ ] Timer d'inactivité de 10 min (RACE-12)
- [ ] Trois accès : liste publique (room index), code court sans caractères ambigus, lien privé invalidé au départ (LOB-1 à LOB-4)
- [ ] Bouton « Jouer » vers le lobby public le plus rempli, sinon création (GEN-5, GEN-6)
- [ ] E2E Playwright : 2 navigateurs rejoignent et terminent une course
- ✅ Une vraie course à plusieurs postes, de bout en bout, en production

### Phase 3 — Comptes et persistance
- [ ] Inscription par nom d'utilisateur et mot de passe avec avertissement de perte, connexion, déconnexion, session persistante (AUTH-1, AUTH-2, AUTH-5 à AUTH-8)
- [ ] Limitation des tentatives par compte et par IP (AUTH-7)
- [ ] Identifiant invité en cookie ; jeu sans compte (GEN-2)
- [ ] `/api/races/complete` signé : écriture de `races`, `race_results`, `key_stats` ; bots exclus (BOT-5)
- [ ] Page de bilan de course, invités compris (STAT-5)
- ✅ E2E : inscription → course → résultat enregistré

### Phase 4 — Statistiques
- [ ] Tableau de bord : meilleur MPM, moyenne, précision, nombre de courses, victoires, courbe d'évolution (STAT-1, STAT-2)
- [ ] **Carte de chaleur du clavier** (disposition AZERTY-CA / QWERTY selon la langue), accessible : valeurs lisibles, pas seulement la couleur (STAT-3, UI-8)
- [ ] Points à travailler, progression récente (STAT-4)
- [ ] Historique complet et classement général (STAT-8)
- ✅ E2E : inscription → course → tableau de bord (QA-2)

### Phase 5 — Finition de l'Essentiel (jalon **MVP**)
- [ ] DA appliquée partout, thèmes clair et sombre (UI-1, UI-2)
- [ ] Audit d'accessibilité : clavier, focus, contrastes AA, `prefers-reduced-motion`, axe-core en CI (UI-7, UI-8)
- [ ] FR/EN complet (GEN-3)
- [ ] README complet (QA-4)
- ✅ **Tout l'Essentiel livré et testé**

### Phase 6 — Souhaitable (ordre suggéré, du plus rentable au plus coûteux)
1. [ ] Relance dans le même lobby, transfert ou désignation de l'hôte (LOB-10, LOB-11)
2. [ ] Reprise après coupure : resynchro, temps non rendu, abandon après 60 s (RACE-13, TECH-9)
3. [ ] Stats invité (6 dernières courses) rattachées au compte à la connexion (STAT-6, STAT-7)
4. [ ] Caractères imposés, bot « impossible » (TXT-5, BOT-6)
5. [ ] Avatars, paramètres, profil public, changement de nom et de mot de passe, suppression du compte (PROF-1 à PROF-4)
6. [ ] OAuth Discord et GitHub : choix du nom et du mot de passe au premier accès, courriel ignoré (AUTH-3, AUTH-4)
7. [ ] Mobile : pages responsives, course remplacée par un message et un mode spectateur (UI-5, UI-6)
8. [ ] **Bonus** : attribution à la moitié arrière, cibles, puissance selon l'écart, carapace, floutage, 3e bonus (gel, H-24), bots qui utilisent les bonus, option hôte (BON-1 à BON-8)
- ✅ E2E sur chaque fonctionnalité ; tests unitaires de `bonus.ts`

### Backlog (moins prioritaire)
TXT-7 extraits de films · STAT-9 gamification · RACE-15 contre-la-montre · PROF-5 téléversement d'avatar · rôle enseignant (H-14)

---

## 5. Risques

| Risque | Mitigation |
|---|---|
| Quotas gratuits temps réel dépassés | Spike de charge en phase 0 ; ticks agrégés ; frappes groupées ; plan B Ably |
| Désynchronisation du décompte | Heure de départ absolue envoyée par le serveur + estimation du décalage d'horloge (ping) |
| Triche (progression forgée) | Le serveur rejoue les frappes avec le même réducteur pur ; plafond de MPM plausible |
| Corpus offensant | Listes et corpus curés, liste de mots bannis, test unitaire de filtrage (TXT-8) |
| Réponses du client qui changent les règles | Règles paramétrées dans `src/game/` (constantes) ; hypothèses référencées dans le code |
| Portée des bonus | Placés en dernier dans la phase 6, derrière un drapeau activable |

---

## 6. Décisions en attente du client
Q-1 (plafond de joueurs) · Q-2 / Q-3 (mode et pénalité d'erreur) · Q-4 (mot de passe OAuth) · Q-5 (lien privé) · Q-6 (3e bonus) · Q-7 (découpage bonus) · Q-16 (date de livraison) — tant qu'elles ne sont pas tranchées, les hypothèses H-* du cahier v3 s'appliquent.
