// New-method hook (PostToolUse Edit|Write|MultiEdit).
// Compares the edited file with its HEAD version using the TypeScript AST. If a named
// method appeared (top-level function, const arrow/function, class method), it tells
// Claude to commit it now following .claude/skills/commit/SKILL.md.
// The Stop hook in auto-commit.sh stays the backstop for anything left uncommitted.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const input = JSON.parse(readFileSync(0, "utf8"));
const file = input.tool_response?.filePath ?? input.tool_input?.file_path;
if (!file || !existsSync(file)) process.exit(0);
if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file) || /\.(test|spec)\.|\.d\.ts$/.test(file)) process.exit(0);

const git = (...args) => execFileSync("git", args, { cwd: path.dirname(file), encoding: "utf8", stdio: "pipe" });

let root;
try {
  root = git("rev-parse", "--show-toplevel").trim();
} catch {
  process.exit(0);
}
if (git("branch", "--show-current").trim() === "main") process.exit(0);

const rel = path.relative(root, file);
if (rel.startsWith("..")) process.exit(0);

let before = "";
try {
  before = git("show", `HEAD:${rel}`);
} catch {
  // New or untracked file: every method in it is new.
}

const isFunction = (node) =>
  node && (ts.isArrowFunction(node) || ts.isFunctionExpression(node));

function methodNames(source) {
  const sf = ts.createSourceFile(rel, source, ts.ScriptTarget.Latest, true);
  const names = new Set();
  for (const stmt of sf.statements) {
    if (ts.isFunctionDeclaration(stmt) && stmt.name) {
      names.add(stmt.name.text);
    } else if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && isFunction(decl.initializer)) names.add(decl.name.text);
      }
    } else if (ts.isClassDeclaration(stmt) && stmt.name) {
      for (const member of stmt.members) {
        const isMethod =
          ts.isMethodDeclaration(member) ||
          (ts.isPropertyDeclaration(member) && isFunction(member.initializer));
        if (isMethod && member.name && ts.isIdentifier(member.name)) {
          names.add(`${stmt.name.text}.${member.name.text}`);
        }
      }
    }
  }
  return names;
}

const old = methodNames(before);
const added = [...methodNames(readFileSync(file, "utf8"))].filter((n) => !old.has(n));
if (added.length === 0) process.exit(0);

const list = added.map((n) => `\`${n}\``).join(", ");
console.log(
  JSON.stringify({
    decision: "block",
    reason:
      `New method(s) not committed yet in ${rel}: ${list}.\n` +
      "If they are complete and compile, commit them now following .claude/skills/commit/SKILL.md " +
      "(stage only the related files; for a feat, run its tests first). " +
      "If they are still in progress, finish them first, then commit.",
  }),
);
