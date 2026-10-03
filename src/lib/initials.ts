/** Initiales d'un nom d'utilisateur pour un avatar sans image : `Megumi_Shadows` → `MS`. */
export function initials(name: string): string {
  const words = name.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (words.length === 0) return '?';
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}
