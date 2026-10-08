# Exigences — matrice de traçabilité

Version initiale (checkpoint 1, 2026-10-07). Source : `Web-V-Travail-de-session.pdf`.
Statuts : **Complet**, **Partiel**, **Non fait**. Un statut « Partiel » dit ce qui manque dans les notes.
Les tests unitaires sont dans `tests/` (Vitest), les tests de bout en bout dans `e2e/` (Playwright).

Résumé : 40 complètes · 34 partielles · 16 non faites (90 exigences).

## 3. Contraintes techniques

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
|---|---|---|---|---|
| TECH-01 | Complet | `src/app/`, `next.config.ts` | — | Next.js 16 App Router, React 19, React Compiler. |
| TECH-02 | Partiel | `tsconfig.json`, `eslint.config.mjs` | CI (typecheck, lint) | `strict: true`, `no-explicit-any` en erreur, aucun `@ts-ignore`. Restent des fichiers de configuration `.mjs` (ESLint, PostCSS) et un hook `.claude/hooks/new-method.mjs` à convertir. |
| TECH-03 | Complet | `src/app/globals.css` | — | Tailwind CSS 4, configuration CSS (`@theme`). |
| TECH-04 | Partiel | `src/db/schema.ts`, `drizzle/`, `drizzle.config.ts` | `tests/lib/*`, `e2e/auth.spec.ts` | PostgreSQL + Drizzle, migrations versionnées et appliquées au déploiement. Manque le script de seed (corpus, utilisateurs, historique). |
| TECH-05 | Complet | `railway.json`, `server.ts` | `GET /api/health` en production | Déployé sur Railway (service Node long), HTTPS, http redirigé vers https. Base sur Neon. |
| TECH-06 | Complet | `src/realtime/`, `src/components/race/useRaceSocket.ts` | `tests/realtime/*`, `e2e/lobby-realtime.spec.ts` | WebSocket `ws` maison, tick agrégé à 5 Hz. Voir ADR-001 dans `ARCHITECTURE.md`. |
| TECH-07 | Partiel | `src/game/protocol.ts`, `src/lib/lobbies.ts`, `src/lib/auth/guest.ts` | `tests/game/protocol.test.ts` | Messages WebSocket et actions de salle validés par zod. Certaines actions serveur et routes (code de salle, formulaires d'auth) valident à la main : à passer sur zod. |
| TECH-08 | Complet | — | — | Railway (à ma charge), Neon et OAuth en forfait gratuit. |
| TECH-09 | Complet | `.github/workflows/test.yml` | — | Lint, `tsc --noEmit` et tests unitaires à chaque push et PR sur `main` et `dev`. |
| TECH-10 | Complet | `.env.example` | — | Toutes les variables lues par le code sont documentées ; `.env` ignoré par git. |

## 4. Identité visuelle et design

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
|---|---|---|---|---|
| DES-01 | Non fait | `docs/DEMARCHE-CREATIVE.md` | — | En rédaction par l'auteur. |
| DES-02 | Non fait | `docs/DEMARCHE-CREATIVE.md`, `src/app/favicon.ico` | — | En rédaction par l'auteur. Le favicon est encore celui par défaut de Next.js. |
| DES-03 | Non fait | `docs/DEMARCHE-CREATIVE.md` | — | En rédaction par l'auteur. |
| DES-04 | Partiel | `src/components/`, `src/app/globals.css` | — | Direction propre (cadres biseautés, typographies, piste). La piste comme élément signature est à pousser. |
| DES-05 | Non fait | — | — | Thème sombre seulement. Thème clair, sélecteur, préférence système et absence de flash à faire. |
| DES-06 | Partiel | `src/components/layout/MobileMenu.tsx` | `e2e/screenshots.spec.ts` (projet `mobile`) | Pages responsives. Message « clavier physique » à la place de la course sur mobile à faire. |

## 5.2 Comptes et profil

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
|---|---|---|---|---|
| AUTH-01 | Complet | `src/lib/auth/`, `src/app/api/auth/[provider]/`, `src/app/actions/auth.ts` | `e2e/auth.spec.ts`, `tests/lib/auth/*` | Discord et GitHub (arctic, sans portée courriel) + nom d'utilisateur / mot de passe. Sessions en base, hash du jeton seulement. |
| AUTH-02 | Complet | `src/lib/auth/guest.ts`, `src/lib/auth/guestCookie.ts`, `src/lib/auth/signedCookie.ts` | `tests/lib/auth/guest.test.ts`, `tests/lib/auth/signedCookie.test.ts`, `e2e/auth.spec.ts` | Pseudo de 3 à 20 caractères, cookie signé HMAC. |
| AUTH-03 | Complet | `src/app/actions/lobbies.ts`, `src/components/shared/Avatar.tsx` | `e2e/auth.spec.ts` | Un invité ne peut pas créer de salle ; avatar à initiales. |
| AUTH-04 | Complet | `src/lib/auth/avatar.ts`, `src/app/api/avatar/[username]/route.ts` | `tests/lib/auth/avatar.test.ts`, `e2e/auth.spec.ts` | JPEG, PNG, WebP ; 2 Mo max vérifiés côté serveur ; redimensionné en WebP par sharp. |
| AUTH-05 | Complet | `src/components/profile/EditProfileDialog.tsx`, `src/lib/auth/profile.ts` | `tests/components/profile/*`, `e2e/auth.spec.ts` | Nom d'affichage distinct du nom de connexion. |
| AUTH-06 | Partiel | `src/app/[locale]/profile/`, `src/components/profile/`, `src/lib/stats.ts` | `tests/components/profile/*` | Meilleur MPM, moyenne, précision, courses, victoires, courbe du MPM. À vérifier de bout en bout avec de vraies courses. |

## 5.3 Salles et visibilité

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
|---|---|---|---|---|
| SALLE-01 | Complet | `src/app/actions/lobbies.ts`, `src/components/lobby/lobbyRoom.ts` | `tests/components/lobby/lobbyRoom.test.ts`, `e2e/lobby-realtime.spec.ts` | Compte connecté seulement ; l'hôte peut passer spectateur et revenir. |
| SALLE-02 | Complet | `src/components/home/join.ts`, `src/components/lobby/newLobby.ts` | `tests/components/home/join.test.ts`, `tests/components/lobby/newLobby.test.ts` | 6 caractères sans 0/O/1/I/L, affichés `XXX-XXX`. Unicité vérifiée dans le registre. |
| SALLE-03 | Complet | `src/components/lobby/lobbyAccess.ts`, `src/lib/openLobby.ts` | `tests/components/lobby/lobbyAccess.test.ts`, `e2e/lobby-realtime.spec.ts` | Publique, sur code, privée. Le code seul refuse une salle privée (404). Nouvelle salle privée par défaut. |
| SALLE-04 | Partiel | `src/lib/invites.ts`, `src/components/lobby/InviteCard.tsx`, `src/components/lobby/InviteLinksDialog.tsx` | `tests/components/lobby/InviteCard.test.tsx`, `tests/components/lobby/InviteLinksDialog.test.tsx`, `e2e/lobby-invite.spec.ts`, `e2e/lobby-realtime.spec.ts` | Jeton de 128 bits+, usage unique lié à l'IP, révoqué à l'expulsion. L'hôte gère jusqu'à 30 liens dans une fenêtre (création à l'unité ou en lot, copie, suppression, statut libre / utilisé par qui / révoqué). Manque l'invalidation à la fermeture de la salle. |
| SALLE-05 | Partiel | `src/components/lobby/lobbyRoom.ts` | `tests/components/lobby/lobbyRoom.test.ts` | Spectateurs hors capacité. Le maximum est 60 : à ramener à 30. |
| SALLE-06 | Partiel | `src/lib/lobbyPresence.ts` | `tests/lib/lobbyPresence.test.ts` | Un 2ᵉ onglet ne crée pas de doublon. Manque la contrainte en base et la proposition de quitter l'autre salle. |
| SALLE-07 | Partiel | `src/components/lobby/lobbyRoom.ts`, `src/app/actions/lobbies.ts` | `tests/components/lobby/lobbyRoom.test.ts` | Expulsion et révocation du lien faites ; la personne expulsée peut encore revenir par le code. |
| SALLE-08 | Complet | `src/components/lobby/lobbyRoom.ts`, `src/lib/lobbyPresence.ts` | `tests/lib/lobbyPresence.test.ts`, `tests/components/lobby/lobbyRoom.test.ts` | Le rôle passe à l'humain présent depuis le plus longtemps ; salle fermée s'il n'en reste aucun. |
| SALLE-09 | Partiel | `src/components/lobby/lobbyRoom.ts` | `tests/components/lobby/lobbyRoom.test.ts` | Pendant une course, un arrivant devient spectateur au lieu d'être refusé. |
| SALLE-10 | Non fait | — | — | Limite de tentatives par IP sur le code à ajouter (le limiteur de `src/lib/auth/rateLimit.ts` est réutilisable). |

## 5.4 Rejoindre une course

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
|---|---|---|---|---|
| JOIN-01 | Complet | `src/components/home/JoinForm.tsx`, `src/components/home/join.ts` | `tests/components/home/JoinForm.test.tsx`, `e2e/lobby-realtime.spec.ts` | Champ de code sur l'accueil ; e2e : un invité tape le code et l'hôte le voit arriver. |
| JOIN-02 | Partiel | `src/components/lobbies/` | `tests/components/lobbies/*` | Liste et filtres (langue, caractères). Manquent le filtre de complexité et la mise à jour sans rechargement. |
| JOIN-03 | Non fait | — | — | Bouton « Faire une course » à faire. |

## 5.5 Configuration de la course

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
|---|---|---|---|---|
| CONF-01 | Partiel | `src/components/lobby/lobbyRoom.ts` | `tests/components/lobby/lobbyRoom.test.ts` | Aucun ou 30 s à 3 min : à étendre jusqu'à 10 min. |
| CONF-02 | Complet | `src/components/lobby/LobbySettingsPanel.tsx`, `src/game/text/` | `tests/game/text/generate.test.ts` | Français ou anglais, indépendant de la langue de l'interface. |
| CONF-03 | Partiel | `src/game/text/corpus.ts`, `src/game/text/generate.ts` | `tests/game/text/generate.test.ts` | Modes phrases et mots aléatoires. Le corpus est dans le code : à déplacer en base. |
| CONF-04 | Complet | `src/components/lobby/lobbyRoom.ts` | `tests/components/lobby/lobbyRoom.test.ts` | 10 à 300 mots. |
| CONF-05 | Non fait | — | — | Complexité facile / moyen / difficile et critères à définir. |
| CONF-06 | Complet | `src/game/text/generate.ts`, `src/components/lobby/LobbySettingsPanel.tsx` | `tests/game/text/generate.test.ts` | Ponctuation, nombres, majuscules, accents. |
| CONF-07 | Partiel | `src/game/text/generate.ts` | `tests/game/text/generate.test.ts` | Caractères à pratiquer (inclusion). Exclusion et comportement en mode cohérent à faire et documenter. |
| CONF-08 | Complet | `src/game/typing.ts` | `tests/game/typing.test.ts` | Modes `block` (correction obligatoire) et `accumulate` (libre). |
| CONF-09 | Partiel | `src/components/lobby/lobbyRoom.ts` | — | Option présente ; les bonus eux-mêmes sont à faire. |
| CONF-10 | Complet | `src/components/lobby/ParticipantList.tsx`, `src/game/bots.ts` | `tests/components/lobby/*`, `e2e/lobby-realtime.spec.ts` | Ajout, retrait et niveau de chaque bot. |
| CONF-11 | Partiel | `src/components/lobby/LobbySettingsPanel.tsx` | `e2e/lobby-settings.spec.ts` | Visibilité complète ; capacité maximale à ramener à 30 (SALLE-05). |
| CONF-12 | Complet | `src/app/api/lobbies/[code]/events/route.ts`, `src/components/lobby/useLobbyEvents.ts` | `e2e/lobby-realtime.spec.ts` | Diffusion SSE à chaque changement. |

## 5.6 Déroulement d'une course

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
|---|---|---|---|---|
| COURSE-01 | Partiel | `src/game/race.ts`, `src/components/lobby/lobbyRoom.ts`, `docs/ARCHITECTURE.md` | `tests/game/race.test.ts` | Machine documentée. Retour automatique en attente ; l'état FERMÉE par l'hôte reste à faire. |
| COURSE-02 | Complet | `src/components/lobby/lobbyRoom.ts` | `tests/components/lobby/lobbyRoom.test.ts` | ≥ 2 participants dont 1 humain, bots compris, spectateurs exclus. |
| COURSE-03 | Complet | `src/game/race.ts`, `src/components/race/Countdown.tsx` | `tests/game/race.test.ts`, `tests/components/race/Countdown.test.tsx` | Heure de départ fixée par le serveur. |
| COURSE-04 | Partiel | `src/components/race/TypingArea.tsx`, `src/components/race/RaceHud.tsx` | `tests/components/race/TypingArea.test.tsx` | Retour visuel, MPM et précision en direct. Le coller n'est pas bloqué explicitement. |
| COURSE-05 | Partiel | `src/components/race/RaceTrack.tsx` | `tests/components/race/RaceTrack.test.tsx` | Piste à 5 Hz, joueur local mis en évidence, spectateurs sans zone de frappe. Interpolation à vérifier. |
| COURSE-06 | Complet | `src/game/race.ts`, `src/realtime/raceRoom.ts` | `tests/game/race.test.ts`, `tests/realtime/raceRoom.test.ts` | Frappes rejouées côté serveur ; horodatages incohérents et MPM implausible refusés. |
| COURSE-07 | Complet | `src/components/race/ConfirmDialog.tsx` | `tests/components/race/ConfirmDialog.test.tsx` | Abandon avec confirmation. |
| COURSE-08 | Partiel | `src/game/race.ts` | `tests/game/race.test.ts` | Reprise après coupure ; délai actuel de 60 s à ramener à 30 s. |
| COURSE-09 | Complet | `src/game/race.ts` | `tests/game/race.test.ts` | |
| COURSE-10 | Complet | `src/game/race.ts` | `tests/game/race.test.ts` | Terminés, puis temps écoulé, puis abandons. |
| COURSE-11 | Non fait | — | — | Choix relancer / fermer de l'hôte à faire. |

## 5.7 Bots

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
|---|---|---|---|---|
| BOT-01 | Partiel | `src/game/bots.ts` | `tests/game/bots.test.ts` | Six niveaux : à ramener aux cinq de l'énoncé (voir `ARCHITECTURE.md` §5). |
| BOT-02 | Partiel | `src/game/bots.ts` | `tests/game/bots.test.ts` | Vitesse tirée à chaque mot et par touche. Ralentissement sur les mots difficiles à faire. |
| BOT-03 | Complet | `src/game/bots.ts` | `tests/game/bots.test.ts` | Faute, pause de 250 ms, correction selon le mode d'erreur. |
| BOT-04 | Partiel | `src/components/lobby/ParticipantList.tsx` | — | Identifiés comme bots avec leur niveau. Soumis aux bonus quand ceux-ci existeront. |
| BOT-05 | Complet | `src/game/bots.ts`, `src/game/random.ts` | `tests/game/bots.test.ts`, `tests/game/random.test.ts` | PRNG seedé. |

## 5.8 Bonus de remontée

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
|---|---|---|---|---|
| BONUS-01 | Non fait | `src/game/energy.ts` | `tests/game/energy.test.ts` | Une jauge d'énergie existe ; l'attribution aux points de contrôle reste à faire. |
| BONUS-02 | Non fait | — | — | |
| BONUS-03 | Non fait | — | — | |
| BONUS-04 | Non fait | — | — | |

## 5.9 Résultats et statistiques

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
|---|---|---|---|---|
| RES-01 | Complet | `src/components/race/RacePodium.tsx` | `tests/components/race/RacePodium.test.tsx` | |
| RES-02 | Partiel | `src/components/race/RaceResultsTable.tsx` | `tests/components/race/RaceResultsTable.test.tsx` | Colonnes MPM brut, bonus reçus et statut à compléter. |
| RES-03 | Partiel | `src/components/profile/WpmChart.tsx`, `src/components/profile/KeyboardHeatmap.tsx` | `tests/components/profile/*` | Courbe et carte de chaleur sur le profil ; à ajouter sur la page de résultats (courbe de tous les participants). |
| RES-04 | Non fait | — | — | |
| RES-05 | Partiel | `src/realtime/recordResults.ts`, `src/db/schema.ts` | `tests/realtime/recordResults.test.ts`, `e2e/race-results.spec.ts` | Résultats des comptes enregistrés en fin de course. Manque la série temporelle du MPM. |

## 5.10 Historique

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
|---|---|---|---|---|
| HIST-01 | Non fait | — | — | |
| HIST-02 | Non fait | — | — | |

## 5.11 Internationalisation

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
|---|---|---|---|---|
| I18N-01 | Partiel | `messages/en.json`, `messages/fr.json` | `tests/messages/messages.test.ts` | Mêmes clés dans les deux langues, vérifié par test. Audit des chaînes restantes à faire. |
| I18N-02 | Complet | `src/components/layout/LanguageSwitcher.tsx`, `src/i18n/locale-redirect.ts`, `src/proxy.ts` | `tests/i18n/locale-redirect.test.ts`, `tests/components/layout/LanguageSwitcher.test.tsx` | Sélecteur dans l'en-tête de chaque page, choix gardé en cookie, langue du navigateur par défaut. Sous-domaine `fr.` sur le domaine racine, préfixe `/fr` sur un autre hôte (Railway). |
| I18N-03 | Partiel | `src/components/profile/*`, `src/components/race/*` | — | Formatage selon la langue dans plusieurs composants ; audit complet à faire. |

## 6. Qualité

| ID | Statut | Fichiers principaux | Tests associés | Notes et choix |
|---|---|---|---|---|
| TEST-01 | Complet | `tests/` | 100+ fichiers, Vitest | Logique pure de `src/game/` couverte sans mock. |
| TEST-02 | Complet | `e2e/`, `playwright.config.ts` | 7 specs | Projets desktop, mobile et Firefox. Pas encore lancés en CI. |
| TEST-03 | Complet | `e2e/auth.ts` | `e2e/*.spec.ts` | Comptes créés par nom d'utilisateur et mot de passe. |
| PERF-01 | Non fait | — | — | Lighthouse à mesurer sur l'accueil. |
| PERF-02 | Complet | `src/components/race/useRaceSocket.ts`, `src/realtime/recordResults.ts` | `tests/realtime/*` | Frappes groupées (~150 ms), tick à 5 Hz, écriture en base en fin de course seulement. |
| PERF-03 | Partiel | `src/components/race/RaceTrack.tsx` | — | À mesurer avec 30 participants. |
| A11Y-01 | Partiel | `src/app/globals.css` | — | Thème sombre seulement ; contrastes AA à vérifier dans les deux thèmes. |
| A11Y-02 | Partiel | `src/components/` | — | `header`, `nav`, `main`, `footer`, tableaux pour les résultats. Audit à faire. |
| A11Y-03 | Partiel | `src/components/` | Tests de composants (requêtes par rôle et libellé) | Audit à faire. |
| A11Y-04 | Partiel | `src/components/` | — | Audit clavier et focus visible à faire. |
| SEC-01 | Complet | `src/app/actions/lobbies.ts`, `src/components/lobby/lobbyRoom.ts` | `tests/components/lobby/lobbyRoom.test.ts` | L'auteur d'une action est toujours l'utilisateur de la session ; le réducteur vérifie le rôle d'hôte. |
| SEC-02 | Complet | `src/lib/auth/avatar.ts` | `tests/lib/auth/avatar.test.ts`, `e2e/auth.spec.ts` | Type réel lu par sharp, taille vérifiée côté serveur. |
| SEC-03 | Complet | `src/lib/auth/password.ts` | `e2e/auth.spec.ts` | Argon2id, jamais journalisé. |

## Choix documentés (section 2.2)

- **Code de salle** : affiché `XXX-XXX` pour la lisibilité ; le tiret ne fait pas partie des 6 caractères.
- **Visibilité par défaut** : une nouvelle salle est privée ; l'hôte la passe en « sur code » ou « publique ».
- **Langue** : anglais sur le domaine racine, français sur `fr.<domaine>` ; sur un hôte sans domaine dédié
  (Railway), préfixe `/fr`. Le choix explicite (cookie) passe avant la langue du navigateur.
- **Invités** : leurs résultats sont gardés dans leur cookie et rattachés au compte à l'inscription ou à la connexion.
