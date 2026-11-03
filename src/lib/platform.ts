// Système d'exploitation du visiteur, lu dans `navigator.userAgent`, pour afficher les bonnes touches.

export type Os = 'mac' | 'windows' | 'linux' | 'other';

/** iPadOS et iOS comptent comme Mac : un clavier Apple a la même touche Option. Android déclare « Linux », on l'écarte avant. */
export function detectOs(userAgent: string): Os {
  if (/Mac|iPhone|iPad|iPod/.test(userAgent)) return 'mac';
  if (/Windows/.test(userAgent)) return 'windows';
  if (/Android/.test(userAgent)) return 'other';
  if (/Linux|X11|CrOS/.test(userAgent)) return 'linux';
  return 'other';
}

/**
 * Touche qui accompagne les raccourcis des capacités. Sur Mac c'est Option (⌥), la touche Alt d'Apple :
 * ⌘ est exclu, car ⌘+Q quitte le navigateur et ⌘+W ferme l'onglet sans que la page puisse l'empêcher.
 */
export function modifierKey(os: Os): { symbol: string; name: string } {
  return os === 'mac' ? { symbol: '⌥', name: 'Option' } : { symbol: 'Alt', name: 'Alt' };
}
