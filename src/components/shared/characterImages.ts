// Choix de l'image d'un personnage parmi les fichiers de public/images/characters (logique pure).

const EXTENSIONS = ['webp', 'avif', 'png', 'jpg', 'jpeg'];

/** Chemin public de `<id>.<ext>` s'il existe dans `files`, en préférant les formats légers ; sinon `null`. */
export function findCharacterImage(id: string, files: readonly string[]): string | null {
  for (const extension of EXTENSIONS) {
    const file = files.find((name) => name.toLowerCase() === `${id}.${extension}`);
    if (file) return `/images/characters/${file}`;
  }
  return null;
}

/** Largeur d'affichage de l'illustration en pied (904 × 1270) pour que le visage remplisse la carte. */
export const FACE_ZOOM_WIDTH = 1050;
const ILLUSTRATION_RATIO = 1270 / 904;

/** Position du visage dans l'illustration, en fractions de sa largeur et de sa hauteur. */
export type FacePoint = { x: number; y: number };

/** Taille et position de l'illustration agrandie : le visage est centré à l'horizontale et posé à `anchorY` px du haut de la carte. */
export function faceFrame(face: FacePoint, anchorY: number): { width: number; left: string; top: number } {
  const width = FACE_ZOOM_WIDTH;
  return {
    width,
    left: `calc(50% - ${face.x * width}px)`,
    top: anchorY - face.y * width * ILLUSTRATION_RATIO,
  };
}

/** Agrandissement de l'illustration dans un avatar rond : sa largeur vaut `AVATAR_ZOOM` fois le diamètre. */
export const AVATAR_ZOOM = 5;

/** Taille et position (px) de l'illustration dans un avatar rond de `size` px, visage au centre. */
export function faceCrop(face: FacePoint, size: number): { width: number; left: number; top: number } {
  const width = size * AVATAR_ZOOM;
  return {
    width,
    left: size / 2 - face.x * width,
    top: size / 2 - face.y * width * ILLUSTRATION_RATIO,
  };
}
