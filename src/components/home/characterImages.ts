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
