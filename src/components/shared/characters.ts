import type { FacePoint } from './characterImages';

// Personnages jouables (accueil, avatars, choix du personnage). `id` est aussi le nom du fichier
// dans public/images/characters ; `face` est le centre du visage, en fractions de l'illustration.
export const CHARACTERS = [
  { id: 'yuji', name: 'Yuji Itadori', face: { x: 0.5, y: 0.13 } },
  { id: 'megumi', name: 'Megumi Fushiguro', face: { x: 0.51, y: 0.13 } },
  { id: 'nobara', name: 'Nobara Kugisaki', face: { x: 0.52, y: 0.145 } },
  { id: 'gojo', name: 'Satoru Gojo', face: { x: 0.5, y: 0.115 } },
  { id: 'maki', name: 'Maki Zenin', face: { x: 0.53, y: 0.15 } },
  { id: 'yuta', name: 'Yuta Okkotsu', face: { x: 0.5, y: 0.1 } },
  { id: 'todo', name: 'Aoi Todo', face: { x: 0.52, y: 0.14 } },
  { id: 'sukuna', name: 'Ryomen Sukuna', face: { x: 0.5, y: 0.14 } },
] as const satisfies readonly { id: string; name: string; face: FacePoint }[];

export type Character = (typeof CHARACTERS)[number];
export type CharacterId = Character['id'];
