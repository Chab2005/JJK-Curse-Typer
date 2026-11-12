import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Contraste WCAG 2.1 des couleurs de texte du thème sombre sur ses fonds (A11Y-01).
const css = readFileSync('src/app/globals.css', 'utf8');
const token = (name: string): string => {
  const hex = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
  if (!hex) throw new Error(`token ${name} introuvable`);
  return hex;
};

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const BACKGROUNDS = ['surface', 'surface-container-low', 'surface-container', 'surface-container-high'];
const TEXTS = ['on-surface', 'on-surface-variant', 'on-primary-container', 'primary', 'primary-text', 'outline', 'tertiary', 'secondary', 'error'];

describe('contrastes de texte (A11Y-01)', () => {
  it.each(TEXTS)('%s atteint 4,5:1 sur les fonds sombres', (text) => {
    for (const background of BACKGROUNDS) {
      expect(contrast(token(text), token(background)), `${text} sur ${background}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('le texte sur fond cramoisi reste lisible', () => {
    expect(contrast(token('on-primary-container'), token('primary-container'))).toBeGreaterThanOrEqual(4.5);
  });
});

describe('classes de texte sous le seuil (A11Y-01)', () => {
  it("n'utilise plus text-primary-container ni text-outline/70 pour du texte lisible", async () => {
    const { execSync } = await import('node:child_process');
    const found = execSync(String.raw`grep -rnE "text-primary-container([^-a-z]|$)|text-outline/70" src || true`, { encoding: 'utf8' });
    expect(found).toBe('');
  });
});
