import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : path.endsWith('.tsx') ? [path] : [];
  });
}

// Texte visible écrit en dur (I18N-01) : `alt` et `placeholder` doivent venir des catalogues.
describe('chaînes en dur', () => {
  it.each(['alt', 'placeholder', 'aria-label', 'title'])('aucun attribut %s littéral dans src/', (attribute) => {
    const pattern = new RegExp(`\\s${attribute}="[^"{]*[A-Za-z]{3,}[^"]*"`);
    const offenders = files('src').filter((file) => pattern.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
