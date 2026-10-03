import { describe, expect, it } from 'vitest';
import { normalizePin, pickRandomPseudo } from '@/components/home/join';

describe('pickRandomPseudo', () => {
  const pseudos = ['Megumi_Shadows', 'Yuji_BlackFlash', 'Nobara_Resonance'];

  it('ne renvoie jamais le pseudo actuel', () => {
    for (const roll of [0, 0.34, 0.5, 0.99]) {
      expect(pickRandomPseudo('Megumi_Shadows', pseudos, () => roll)).not.toBe('Megumi_Shadows');
    }
  });

  it('pioche dans la liste selon le tirage', () => {
    expect(pickRandomPseudo('Megumi_Shadows', pseudos, () => 0)).toBe('Yuji_BlackFlash');
    expect(pickRandomPseudo('Megumi_Shadows', pseudos, () => 0.99)).toBe('Nobara_Resonance');
  });

  it('renvoie le pseudo actuel quand il est le seul choix', () => {
    expect(pickRandomPseudo('Solo', ['Solo'], () => 0.5)).toBe('Solo');
  });
});

describe('normalizePin', () => {
  it('met le code en majuscules et retire les espaces', () => {
    expect(normalizePin('  884-jjk ')).toBe('884-JJK');
  });

  it('renvoie une chaîne vide si rien n’est saisi', () => {
    expect(normalizePin('   ')).toBe('');
  });
});
