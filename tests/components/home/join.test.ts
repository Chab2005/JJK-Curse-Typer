import { describe, expect, it } from 'vitest';
import { formatPinInput, isCompletePin, normalizePin, pickRandomPseudo } from '@/components/home/join';

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

describe('formatPinInput', () => {
  it('met en majuscules et insère le tiret après 3 caractères', () => {
    expect(formatPinInput('abcd')).toBe('ABC-D');
    expect(formatPinInput('884jjk')).toBe('884-JJK');
  });

  it('ne met pas de tiret tant qu’il y a 3 caractères ou moins', () => {
    expect(formatPinInput('ab')).toBe('AB');
    expect(formatPinInput('abc')).toBe('ABC');
    expect(formatPinInput('abc-')).toBe('ABC');
  });

  it('retire les caractères ambigus 0 O 1 I L', () => {
    expect(formatPinInput('0O1IL')).toBe('');
    expect(formatPinInput('a0b1c-oild')).toBe('ABC-D');
  });

  it('retire espaces, ponctuation et accents', () => {
    expect(formatPinInput(' a b_c.d é ')).toBe('ABC-D');
  });

  it('coupe à 6 caractères utiles', () => {
    expect(formatPinInput('abc-defgh')).toBe('ABC-DEF');
  });

  it('remet le tiret au bon endroit quand il est mal placé', () => {
    expect(formatPinInput('ab-cdef')).toBe('ABC-DEF');
  });
});

describe('isCompletePin', () => {
  it('accepte un code XXX-XXX sans caractères ambigus', () => {
    expect(isCompletePin('884-JJK')).toBe(true);
    expect(isCompletePin('ABC-XYZ')).toBe(true);
  });

  it('refuse un code incomplet, sans tiret ou en minuscules', () => {
    expect(isCompletePin('ABC-DE')).toBe(false);
    expect(isCompletePin('ABCDEF')).toBe(false);
    expect(isCompletePin('abc-def')).toBe(false);
  });

  it('refuse un code avec 0 O 1 I L', () => {
    for (const pin of ['AB0-DEF', 'ABO-DEF', 'AB1-DEF', 'ABI-DEF', 'ABL-DEF']) {
      expect(isCompletePin(pin)).toBe(false);
    }
  });
});
