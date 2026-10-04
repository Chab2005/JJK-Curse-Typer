/** Initiales d'un avatar sans image : les deux premières lettres du nom, `Megumi_Shadows` → `ME`. */
export function initials(name: string): string {
  const chars = [...name].filter((char) => /[\p{L}\p{N}]/u.test(char));
  if (chars.length === 0) return '?';
  return chars.slice(0, 2).join('').toUpperCase();
}
