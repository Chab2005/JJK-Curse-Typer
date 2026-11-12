# Utilisation de l'IA

Document de la remise finale (section 8.7 de l'énoncé), 1 à 2 pages.

## 1. Agents et outils utilisés

| Outil | Usage dans le projet | Configuration dans le dépôt |
|---|---|---|
| Claude Code | TODO | `CLAUDE.md`, `.claude/settings.json`, `.claude/hooks/`, `.claude/skills/` |
| Codex | TODO | `AGENTS.md`, `.codex/config.toml`, `.codex/hooks.json`, `.codex/hooks/` |
| GitHub Copilot | TODO | `.github/copilot-instructions.md` |

Rappel : l'IA n'a servi qu'au code. Le nom, le logo et les ressources graphiques sont faits sans IA (DES-01, DES-02).

## 2. Fichiers d'instructions d'agent

Tous commités dans le dépôt :

- `AGENTS.md` : instructions principales, partagées par les agents. `CLAUDE.md` ne fait que l'importer (`@AGENTS.md`).
- `.github/copilot-instructions.md` : TODO (résumé).
- `.agents/skills/` et `.claude/skills/` : compétences (commit, react-best-practices, web-design-guidelines, writing-guidelines, composition-patterns, react-view-transitions, react-native-skills).
- Hooks : `auto-commit.sh` (TODO : rôle), `new-method.mts` (TODO : rôle).

## 3. Trois situations où l'IA s'est trompée

### Situation 1 — TODO titre
- **Ce que l'IA a produit :** TODO
- **Comment je l'ai détecté :** TODO (test qui échoue, revue, comportement en production…)
- **Correction :** TODO (commit : `TODO`)

### Situation 2 — TODO titre
- **Ce que l'IA a produit :** TODO
- **Comment je l'ai détecté :** TODO
- **Correction :** TODO

### Situation 3 — TODO titre
- **Ce que l'IA a produit :** TODO
- **Comment je l'ai détecté :** TODO
- **Correction :** TODO

## 4. Réflexion sur ma façon de travailler avec les agents

TODO (un ou deux paragraphes : ce qui a bien marché, ce que je déléguerais ou non la prochaine fois).
