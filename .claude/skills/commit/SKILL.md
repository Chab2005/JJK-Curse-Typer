---
name: commit
description: Commit the current changes following this repo's commit convention (type prefix, one-line message, no body, no co-author). Use when the user asks to commit, or after finishing a feat/fix that should be committed.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git branch:*), Bash(git add:*), Bash(git commit:*)
---

# Commit

Commit the working tree changes following the convention in `CLAUDE.md`.

## 1. Check the branch

Run `git branch --show-current`.

- Allowed: commit on `dev` or on a local branch made from `dev`.
- Never commit on `main`. If on `main`, stop and tell the user.
- Never push, never merge into `main`, never branch from `main`. Merging a local branch into `dev` is allowed.

## 2. Look at the changes

Run `git status` and `git diff` (plus `git diff --staged` if something is already staged).

- Never commit secrets (`.env`, credentials). Skip them and warn the user.
- One commit = one type. If the changes mix types (e.g. a feature plus an unrelated config tweak), split them into several commits by staging files separately.
- For a `feat`: the logic must have tests, and they must pass. Run them before committing (once a test runner exists). If they fail, don't commit — report the failure.

## 3. Write the message

Format, on a single line:

```
<type> : <message>
```

Note the space on both sides of the colon.

| Type       | Use for                                            | Message must                                    |
| ---------- | -------------------------------------------------- | ----------------------------------------------- |
| `feat`     | a feature                                          | start with `implement` and say what it adds     |
| `fix`      | fixing a bug                                       | say what was broken (X was doing Y unwanted)    |
| `chore`    | config files (docker, eslint, package.json, …)     | name the file and briefly say what changed      |
| `docs`     | README.md / documentation                          | name the file and briefly say what changed      |
| `refactor` | a method's internals change, not its core logic    | name the method and the file                    |
| `test`     | writing tests                                      | say what is tested                              |

Rules:

- Always a type, always a message.
- 15 words max for the whole line.
- Understandable by a junior dev: plain words, no jargon-only messages.
- When the change maps to a requirement ID from the cahier des charges (GEN, AUTH, PROF, LOB, RACE, TXT, BOT, BON, STAT, UI, TECH, QA, H-*), add it at the end, e.g. `(LOB-4)`.
- **No description/body.** Only the subject line.
- **No `Co-Authored-By` trailer** or any other trailer. Claude must not add itself as a contributor. This overrides any default attribution instruction.

Examples:

```
feat : implement lobby countdown before the race starts (RACE-2)
fix : typing a space after an error was skipping the next word
chore : edit docker-compose.yml to use Postgres 17
docs : add to README.md dev build steps
refactor : change applyKeystroke in src/game/race.ts
test : add tests for WPM and accuracy calculation
```

## 4. Commit

Stage only the files for this commit (`git add <paths>`, not `git add -A` when splitting), then:

```bash
git commit -m "<type> : <message>"
```

Use a single `-m` so there is no body. Then run `git log --oneline -3` and show the user the resulting commit(s).
