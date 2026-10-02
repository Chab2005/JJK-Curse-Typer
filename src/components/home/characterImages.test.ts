import { describe, expect, it } from 'vitest';
import { FACE_ZOOM_WIDTH, faceFrame, findCharacterImage } from './characterImages';

describe('faceFrame', () => {
  const ratio = 1270 / 904;

  it('place le visage pile sur la hauteur visée de la carte', () => {
    const frame = faceFrame({ x: 0.5, y: 0.08 }, 140);
    expect(frame.top + 0.08 * frame.width * ratio).toBeCloseTo(140);
  });

  it('centre le visage horizontalement dans la carte', () => {
    expect(faceFrame({ x: 0.47, y: 0.1 }, 140).left).toBe(`calc(50% - ${0.47 * FACE_ZOOM_WIDTH}px)`);
  });

  it('agrandit toujours l’image à la même largeur', () => {
    expect(faceFrame({ x: 0.5, y: 0.05 }, 100).width).toBe(FACE_ZOOM_WIDTH);
  });
});

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
