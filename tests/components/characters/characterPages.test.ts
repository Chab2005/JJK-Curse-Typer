import { describe, expect, it } from 'vitest';
import { findCharacter, neighbours } from '@/components/characters/characterPages';

describe('findCharacter', () => {
  it('trouve un personnage par son identifiant', () => {
    expect(findCharacter('gojo')?.name).toBe('Satoru Gojo');
  });

  it('renvoie undefined pour un identifiant inconnu ou mal cassé', () => {
    expect(findCharacter('mahito')).toBeUndefined();
    expect(findCharacter('Gojo')).toBeUndefined();
  });
});

describe('neighbours', () => {
  it('donne le personnage précédent et le suivant', () => {
    const { prev, next } = neighbours('nobara');
    expect(prev.id).toBe('megumi');
    expect(next.id).toBe('gojo');
  });

  it('boucle aux deux bouts de la liste', () => {
    expect(neighbours('yuji').prev.id).toBe('sukuna');
    expect(neighbours('sukuna').next.id).toBe('yuji');
  });
});
