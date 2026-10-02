import { describe, expect, it } from 'vitest';
import { findCharacterImage } from './characterImages';

describe('findCharacterImage', () => {
  const files = ['yuji.webp', 'megumi.png', 'gojo.JPG', 'notes.txt', 'nobara-old.png'];

  it('trouve l’image du personnage, quelle que soit l’extension d’image', () => {
    expect(findCharacterImage('yuji', files)).toBe('/images/characters/yuji.webp');
    expect(findCharacterImage('megumi', files)).toBe('/images/characters/megumi.png');
  });

  it('accepte une extension en majuscules', () => {
    expect(findCharacterImage('gojo', files)).toBe('/images/characters/gojo.JPG');
  });

  it('renvoie null si aucune image ne porte exactement l’identifiant', () => {
    expect(findCharacterImage('nobara', files)).toBeNull();
    expect(findCharacterImage('maki', files)).toBeNull();
  });

  it('ignore les fichiers qui ne sont pas des images', () => {
    expect(findCharacterImage('notes', files)).toBeNull();
  });

  it('préfère webp quand plusieurs formats existent', () => {
    expect(findCharacterImage('toge', ['toge.png', 'toge.webp'])).toBe('/images/characters/toge.webp');
  });
});
