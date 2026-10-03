# Boucle de course — exigences du cœur de la course

Source : `../Web-V-Travail-de-session.pdf` (énoncé de l'enseignant), sections 5.6 à 5.9, 6.2 et annexe A.
Seules les exigences de la **logique de course** sont reprises ici : machine à états, frappe, score,
classement, bots, bonus, serveur autoritaire et données de résultats. Auth, salles (visibilité, liens,
expulsion), design, i18n et historique sont hors périmètre.

Code concerné : `src/game/` (pur, partagé) et `src/realtime/` (room, hub, seed).

---

## 1. Machine à états (COURSE-01)

```
EN_ATTENTE ──start (hôte, COURSE-02)──▶ DÉCOMPTE ──3, 2, 1──▶ EN_COURSE ──fin (COURSE-09)──▶ RÉSULTATS
    ▲                                                                                        │
    └──────────────── relance (hôte, COURSE-11) ◀────────────────────────────────────────────┤
                                                                                FERMÉE ◀─────┘ fermer (hôte) / plus d'humain
```

- **COURSE-01** — États explicites, machine à états documentée : `EN_ATTENTE → DÉCOMPTE → EN_COURSE → RÉSULTATS → (EN_ATTENTE | FERMÉE)`.
- **COURSE-02** — L'hôte ne lance que si la salle a **au moins 2 participants, dont au moins 1 humain**. Les bots comptent, les spectateurs non.
- **COURSE-03** — **Décompte synchronisé (3, 2, 1)**. Le texte n'est révélé qu'au début du décompte.
- **COURSE-09** — Fin quand **tous les participants ont terminé ou abandonné**, ou quand le **temps maximal** est écoulé.
- **COURSE-11** — Sur l'écran des résultats, l'hôte peut **relancer** avec les mêmes participants (configuration modifiable) ou **fermer la salle**. Les autres peuvent rester ou partir.
- **SALLE-09** — On ne rejoint une salle qu'en `EN_ATTENTE` ou `RÉSULTATS`, jamais pendant une course.

## 2. Frappe et serveur autoritaire

- **CONF-08** — Mode d'erreur : *correction obligatoire* (on n'avance pas tant que l'erreur n'est pas corrigée) ou *libre* (on continue, l'erreur est comptée).
- **CONF-01** — Temps maximal : aucun, ou entre **30 s et 10 min**.
- **COURSE-04** — Retour visuel immédiat (correct, incorrect, curseur), MPM et précision en direct, **coller désactivé**.
- **COURSE-06** — Le **serveur est la source de vérité** pour le temps de départ et de fin, la progression, le classement et l'application des bonus. Il **rejette les progressions impossibles** (saut de progression, vitesse irréaliste).
- **COURSE-07** — Abandon avec confirmation.
- **COURSE-08** — Déconnexion : reprise là où on était si retour **dans les 30 s** ; sinon, abandon.
- **COURSE-05** — Piste : chaque participant (humain ou bot) avec avatar, nom, position et MPM courant ; **≥ ~4 mises à jour perçues par seconde** ; joueur local mis en évidence ; spectateurs sans zone de frappe.
- **TECH-06** — Progression en temps réel (WebSocket ou autre).
- **TECH-07** — Toute entrée serveur validée par schéma (zod), y compris les messages temps réel.
- **PERF-02** — Mises à jour réseau **regroupées ou limitées** (ex. ≤ 10 messages/s par joueur). **Aucune écriture en BD à chaque frappe.**
- **PERF-03** — Piste fluide à capacité maximale (30 participants, SALLE-05).

## 3. Calculs (annexe A — définitions imposées)

| Mesure | Formule |
|---|---|
| **MPM (net)** | (caractères **correctement** tapés ÷ 5) ÷ minutes écoulées |
| **MPM brut** | (caractères **tapés au total** ÷ 5) ÷ minutes écoulées |
| **Précision** | frappes correctes ÷ frappes totales × 100 |
| **Progression** | caractères validés ÷ longueur totale du texte (**en tenant compte des mots ajoutés ou retirés par un bonus**) |

Les espaces comptent comme des caractères.

## 4. Classement final (COURSE-10)

1. Ceux qui ont **terminé**, par temps d'arrivée.
2. Ceux qui n'ont **pas terminé avant la fin du temps**, par progression.
3. Ceux qui ont **abandonné**, par progression au moment de l'abandon.

## 5. Bots (BOT-01 à BOT-05)

| Niveau | MPM visé | Taux d'erreur indicatif |
|---|---|---|
| Noob | 10–20 | ~12 % |
| Débutant | 20–35 | ~8 % |
| Intermédiaire | 35–60 | ~5 % |
| Expert | 70–100 | ~2 % |
| Impossible | 140+ | ~0,5 % |

- **BOT-01** — Cinq niveaux. Plages ajustables si documentées.
- **BOT-02** — Vitesse **variable** : accélérations, hésitations, **ralentissements sur les mots difficiles**. Vitesse constante refusée.
- **BOT-03** — Erreurs qui ralentissent (temps de correction), **respect du mode d'erreur**.
- **BOT-04** — Bots identifiés dans l'interface, **soumis aux bonus et malus** comme les humains.
- **BOT-05** — Moteur **déterministe à partir d'une graine**, testable unitairement.
- **CONF-10** — Ajout / retrait de bots avec le niveau de chacun.

## 6. Bonus de remontée (BONUS-01 à BONUS-04, CONF-09)

- **CONF-09** — Bonus activés ou non.
- **BONUS-01** — Un joueur **en retard** reçoit un bonus aux **points de contrôle**.
  - En retard : **dernier**, ou **à plus de 25 % de progression derrière le meneur**.
  - Points de contrôle : quand le **meneur** passe **25 %, 50 % et 75 %** du texte.
  - **Au plus 3 bonus par joueur et par course.** Règle exacte à documenter.
- **BONUS-02** — **Au moins 3 types**, dont ≥ 1 qui aide le retardataire et ≥ 1 qui ralentit le meneur. Exemples : *+3 mots* au texte du meneur, *−3 mots* au texte du retardataire, *Brouillard* sur les prochains mots du meneur pendant quelques secondes.
- **BONUS-03** — Activation **annoncée** sur la piste et chez le joueur ciblé.
- **BONUS-04** — Progression et MPM **cohérents** quand un texte est allongé ou réduit.

## 7. Données de fin de course (ce que la boucle doit produire)

Persistance en BD et pages de résultats hors périmètre ; la boucle doit seulement **fournir** ces données :

- **RES-01** — Podium des 3 premiers.
- **RES-02** — Par participant : rang, MPM, MPM brut, précision, **nombre d'erreurs**, temps, statut (`terminé` / `temps écoulé` / `abandon`), **bonus reçus**.
- **RES-03** — **Série temporelle du MPM** de chaque participant ; **touches les plus manquées** de chaque joueur.
- **RES-05** — Résultats des humains connectés persistés, série temporelle comprise (envoyés une fois en fin de course, pas à chaque frappe, PERF-02).

---

## 8. État actuel du code

| ID | Statut | Où | Écart avec l'énoncé |
|---|---|---|---|
| COURSE-01 | partiel | `race.ts` (`RacePhase`) | Seulement `countdown → racing → finished`. Il manque `EN_ATTENTE`, `FERMÉE` et la boucle de relance. Le salon d'attente n'est pas sur le serveur (`seed.ts`). |
| COURSE-02 | partiel | `lobbyRoom.ts` (`startBlocker`) | ≥ 2 participants vérifié, **pas « ≥ 1 humain »**. Vérifié côté client seulement. |
| COURSE-03 | partiel | `race.ts` (`COUNTDOWN_MS = 5000`) | Décompte de 5 s, l'énoncé dit 3, 2, 1. Texte envoyé dans `welcome` pendant le décompte (OK). |
| COURSE-04 | fait | composants de course | — |
| COURSE-05 | fait | `raceHub.ts` (`TICK_MS = 200`, 5 Hz) | — |
| COURSE-06 | partiel | `race.ts` (`applyKeys`, `MAX_PLAUSIBLE_WPM = 250`) | Frappes rejouées, lots refusés si trop rapides ou hors ordre. Pas de bonus à appliquer. |
| COURSE-07 | fait | `race.ts` (`abandon`) | — |
| COURSE-08 | partiel | `race.ts` (`RECONNECT_GRACE_MS = 60_000`) | **60 s au lieu de 30 s.** |
| COURSE-09 | fait | `race.ts` (`tick`) | En plus : fin après 10 min d'inactivité (`INACTIVITY_MS`). |
| COURSE-10 | fait | `race.ts` (`standings`) | `timeout` et `racing` sont dans le même groupe (OK). |
| COURSE-11 | non fait | — | Pas de relance, pas de fermeture. La room se ferme quand elle est vide (`raceHub.ts`). |
| CONF-01 | partiel | `lobbyRoom.ts` (`TIMER_OPTIONS`) | **Max 3 min, l'énoncé va jusqu'à 10 min.** |
| CONF-08 | fait | `typing.ts` (`accumulate` / `block`) | — |
| Annexe A, MPM net | **non conforme** | `scoring.ts` (`netWpm`) | Calcul actuel : brut − erreurs/min (H-21). **L'énoncé impose correctement tapés ÷ 5 ÷ min.** |
| Annexe A, précision | fait | `scoring.ts` (`accuracy`) | Ratio 0–1 (×100 à l'affichage). |
| Annexe A, progression | partiel | `race.ts` (`Standing.progress`) | Nombre de caractères justes, **pas un ratio** sur la longueur (nécessaire avec BONUS-04). |
| BOT-01 | partiel | `bots.ts` (`BOT_LEVELS`) | **3 niveaux** (`beginner`, `intermediate`, `expert`) au lieu de 5. Valeurs à aligner. |
| BOT-02 | partiel | `bots.ts` (`fluctuate`) | Vitesse tirée à chaque mot. **Pas de ralentissement sur les mots difficiles**, pas d'hésitation. |
| BOT-03 | fait | `bots.ts` (`nextBotStroke`) | — |
| BOT-04 | partiel | — | Bots identifiés. Bonus pas encore faits. |
| BOT-05 | fait | `random.ts`, `bots.ts` | — |
| BONUS-01 à 04 | non fait | `energy.ts` | Seule une jauge d'énergie existe (BON-1 du cahier v3). **La règle de l'énoncé (points de contrôle à 25/50/75 % du meneur, retardataire, max 3) n'est pas faite.** `TypingState.text` est déjà propre à chaque joueur, ce qui permet +3/−3 mots. |
| TECH-07 | fait | `protocol.ts` (zod) | — |
| PERF-02 | partiel | `protocol.ts` (`MAX_STROKES_PER_BATCH`) | Le client groupe ses frappes (~150 ms). **Pas de limite de débit côté serveur.** |
| RES-02 | partiel | `race.ts` (`Standing`) | Il manque MPM brut, nombre d'erreurs et bonus reçus. |
| RES-03 | non fait | — | Aucune série temporelle de MPM ni stats par touche ratée. |
| SALLE-09 | fait | `raceRoom.ts` (`join`) | Les retardataires deviennent spectateurs. |

## 9. Conflits avec le cahier des charges v3 (à trancher)

Le code suit les hypothèses du cahier v3 ; l'énoncé de l'enseignant dit autre chose. À décider puis à consigner dans `docs/EXIGENCES.md` (section 2.2 de l'énoncé).

| Sujet | Cahier v3 / code | Énoncé |
|---|---|---|
| Formule du MPM net | brut − pénalité par erreur (H-21) | caractères justes ÷ 5 ÷ min (**imposée**, « pour que les résultats soient comparables ») |
| Reprise après coupure | 60 s (H-4) | 30 s |
| Timer max | 3 min | 10 min |
| Capacité | 60 | 30 |
| Niveaux de bots | 3 | 5 |
| Bonus | jauge d'énergie, moitié arrière (BON-*) | points de contrôle 25/50/75 % du meneur, ≤ 3 par joueur |
| Décompte | 5 s | 3, 2, 1 |
| Départ | ≥ 2 participants | ≥ 2 participants **dont ≥ 1 humain** |

## 10. Travaux de la boucle (ordre suggéré)

Chaque étape : tests d'abord dans `tests/game/` ou `tests/realtime/`, puis le code, puis `npm test`, puis un commit.

1. [ ] `scoring.ts` : MPM net selon l'annexe A (caractères justes), MPM brut, précision ; progression en ratio sur la longueur du texte du joueur.
2. [ ] `race.ts` : machine à états complète (`waiting`, `countdown`, `racing`, `results`, `closed`) avec transitions pures et refus des transitions invalides (COURSE-01).
3. [ ] Garde de départ pure : ≥ 2 participants, ≥ 1 humain, spectateurs exclus (COURSE-02).
4. [ ] Décompte 3, 2, 1 (COURSE-03) ; reprise après coupure à 30 s (COURSE-08) ; timer 30 s à 10 min (CONF-01).
5. [ ] `bots.ts` : 5 niveaux (BOT-01), ralentissement sur les mots difficiles et hésitations (BOT-02), toujours seedé (BOT-05).
6. [ ] `bonus.ts` : détection des points de contrôle, choix du retardataire, ≤ 3 bonus, 3 types (+3 mots, −3 mots, brouillard), texte propre à chaque joueur, progression et MPM cohérents (BONUS-01 à 04) ; bots compris (BOT-04).
7. [ ] Événements de bonus dans le `tick` diffusé (BONUS-03).
8. [ ] Données de fin : `Standing` avec MPM brut, erreurs, bonus reçus (RES-02) ; série de MPM échantillonnée par participant et touches ratées par joueur (RES-03).
9. [ ] Room : salon d'attente côté serveur, relance avec les mêmes participants et fermeture par l'hôte (COURSE-11), contrôle de l'hôte côté serveur (SEC-01).
10. [ ] Room : limite de débit des messages par joueur (PERF-02).
11. [ ] Résultats envoyés une fois en fin de course, pour la persistance (RES-05).
