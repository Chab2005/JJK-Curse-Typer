import type { CharacterId } from '@/components/shared/characters';

// Couleurs propres à chaque personnage sur /characters : `ink` pour la technique, `tint` pour le halo
// derrière l'illustration de la fiche, `glow` pour le bord du cadre et la flaque d'ombre sous le sprite.
export const CHARACTER_STYLES: Record<CharacterId, { ink: string; tint: string; glow: string }> = {
  yuji: { ink: 'text-primary', tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_30%,rgb(225_29_72/0.55),#131315_78%)]', glow: '#e11d48' },
  megumi: { ink: 'text-secondary', tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_30%,rgb(49_49_192/0.6),#131315_78%)]', glow: '#3131c0' },
  nobara: { ink: 'text-primary-fixed', tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_30%,rgb(147_0_10/0.6),#131315_78%)]', glow: '#93000a' },
  gojo: { ink: 'text-tertiary-fixed', tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_30%,rgb(0_127_149/0.55),#131315_78%)]', glow: '#007f95' },
  maki: { ink: 'text-on-surface-variant', tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_30%,rgb(92_63_64/0.75),#131315_78%)]', glow: '#5c3f40' },
  yuta: { ink: 'text-tertiary', tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_30%,rgb(0_127_149/0.4),#131315_78%)]', glow: '#007f95' },
  todo: { ink: 'text-primary', tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_30%,rgb(225_29_72/0.35),#131315_78%)]', glow: '#e11d48' },
  sukuna: { ink: 'text-primary', tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_30%,rgb(147_0_10/0.7),#131315_78%)]', glow: '#93000a' },
};
