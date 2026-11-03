#!/bin/bash
# Auto-commit hook.
#   track : (PostToolUse Edit|Write) remember each file Claude modifies in this session.
#   stop  : (Stop) if some of those files are still uncommitted, block the stop and ask
#           Claude to commit them following .claude/skills/commit/SKILL.md.
set -u

mode=${1:-}
input=$(cat)
root=$(git -C "${CLAUDE_PROJECT_DIR:-.}" rev-parse --show-toplevel 2>/dev/null) || exit 0
session=$(jq -r '.session_id // "default"' <<<"$input")
list="$(git -C "$root" rev-parse --absolute-git-dir)/claude-edited-$session"

if [ "$mode" = track ]; then
  f=$(jq -r '.tool_response.filePath // .tool_input.file_path // .tool_input.notebook_path // empty' <<<"$input")
  case "$f" in "$root"/*) ;; *) exit 0 ;; esac
  rel=${f#"$root"/}
  git -C "$root" check-ignore -q -- "$rel" && exit 0
  grep -qxF -- "$rel" "$list" 2>/dev/null || echo "$rel" >>"$list"
  exit 0
fi

[ "$mode" = stop ] && [ -f "$list" ] || exit 0

dirty=()
while IFS= read -r rel; do
  [ -n "$(git -C "$root" status --porcelain -- "$rel")" ] && dirty+=("$rel")
done <"$list"
if [ ${#dirty[@]} -eq 0 ]; then
  rm -f "$list"
  exit 0
fi
printf '%s\n' "${dirty[@]}" >"$list"

# Already asked once this turn (e.g. tests failed): let Claude stop, remind next turn.
[ "$(jq -r '.stop_hook_active // false' <<<"$input")" = true ] && exit 0

if [ "$(git -C "$root" branch --show-current)" = main ]; then
  jq -n '{systemMessage: "auto-commit: on main, files left uncommitted (commits on main are forbidden)."}'
  exit 0
fi

files=$(printf -- '- %s\n' "${dirty[@]}")
jq -n --arg files "$files" '{
  decision: "block",
  reason: ("You modified these files and they are not committed yet:\n" + $files +
    "\nCommit them now following .claude/skills/commit/SKILL.md: semantic `<type> : <message>` single line, one type per commit (split if needed), no body, no Co-Authored-By or any trailer, never commit .env. Then show `git log --oneline -3`.")
}'
