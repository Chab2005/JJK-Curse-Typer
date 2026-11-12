import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Navigation au clavier (A11Y-04) : focus visible global, lien d'évitement vers <main>.
const css = readFileSync('src/app/globals.css', 'utf8');

describe('focus visible global (A11Y-04)', () => {
  it('définit une règle :focus-visible pour les liens, boutons et champs', () => {
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px solid/);
    expect(css).toMatch(/a,\s*button,\s*input,\s*select,\s*textarea/);
  });

  it('chaque <main> porte id="main", cible du lien d’évitement', () => {
    const mains = execSync(String.raw`grep -rn "<main" src || true`, { encoding: 'utf8' }).split('\n').filter(Boolean);
    expect(mains.length).toBeGreaterThan(5);
    expect(mains.filter((line) => !line.includes('id="main"'))).toEqual([]);
  });
});
