import type { FacePoint } from './characterImages';

// Personnages jouables (accueil, avatars, choix du personnage). `id` est aussi le nom du fichier
// dans public/images/characters ; `face` est le centre du visage, en fractions de l'illustration.
export const CHARACTERS = [
  { id: 'yuji', name: 'Yuji Itadori', face: { x: 0.5, y: 0.13 } },
  { id: 'megumi', name: 'Megumi Fushiguro', face: { x: 0.51, y: 0.13 } },
  { id: 'nobara', name: 'Nobara Kugisaki', face: { x: 0.52, y: 0.145 } },
  { id: 'gojo', name: 'Satoru Gojo', face: { x: 0.5, y: 0.115 } },
  { id: 'maki', name: 'Maki Zen’in', face: { x: 0.47, y: 0.15 } },
  { id: 'nanami', name: 'Kento Nanami', face: { x: 0.5, y: 0.135 } },
  { id: 'todo', name: 'Aoi Todo', face: { x: 0.52, y: 0.14 } },
  { id: 'toge', name: 'Toge Inumaki', face: { x: 0.49, y: 0.145 } },
] as const satisfies readonly { id: string; name: string; face: FacePoint }[];

export type Character = (typeof CHARACTERS)[number];
export type CharacterId = Character['id'];
