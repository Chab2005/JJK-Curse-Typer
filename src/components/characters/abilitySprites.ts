import type { CSSProperties } from 'react';
import type { AbilityId } from './characterAbilities';

// Shikigami en pixel art dans le coin haut droit des cartes de capacités, tournés vers la droite sauf `flip`. Bandes de
// public/images/characters/anim/techniques/ten-shadows/ : 8 images de `w` × `h` côte à côte, pattes à 10 px du bas.
// Comme le sprite de la fiche, ils jouent leur bande idle et passent à `hover` (course, langue…) au survol.
// Une capacité sans entrée n'a pas encore de sprite.
const DIR = '/images/characters/anim/techniques/ten-shadows';
const FRAMES = 8;
const FRAME_H = 160;
const DEFAULT_SCALE = 0.75;

/** `zoom` : agrandit une bande dessinée plus petite que l'idle (autour du centre des pattes) ; `foot` : px vides sous les pattes. */
type Strip = { file: string; w: number; h?: number; frameMs: number; zoom?: number; foot?: number };

export type Shikigami = {
  idle: Strip;
  /** Bande jouée au survol ; sans elle, le shikigami garde son idle. */
  hover?: Strip;
  /** Bord gauche de l'image dans la scène, en px affichés. */
  left: number;
  /** Décalage de l'animation, en images, pour que les copies d'un même shikigami ne bougent pas ensemble. */
  delay?: number;
  /** Retourne le shikigami vers la gauche (miroir de toute l'image : `left` vise alors son autre bord). */
  flip?: boolean;
};

/** `width` × `height` : place prise dans le coin, en px affichés ; `scale` : taille affichée / taille du fichier ;
 *  `beside` : le titre et l'effet restent en colonne à gauche du shikigami au lieu de passer dessous. */
export type ShikigamiScene = { width: number; height: number; scale?: number; beside?: boolean; sprites: readonly Shikigami[] };

const strip = (file: string, frameMs: number, w = 128, { zoom = 1, foot = 10, h = FRAME_H } = {}): Strip => ({ file: `${DIR}/${file}`, w, h, frameMs, zoom, foot });

const RABBIT = { idle: strip('rabbit-escape-idle.png', 200), hover: strip('rabbit-escape-running.png', 80) };

export const ABILITY_SPRITES: Partial<Record<AbilityId, ShikigamiScene>> = {
  rabbitEscape: {
    width: 100,
    height: 60,
    // De droite à gauche : chaque lapin passe devant celui de sa droite.
    sprites: [
      { ...RABBIT, left: 29, delay: 5 },
      { ...RABBIT, left: 1, delay: 3 },
      { ...RABBIT, left: -27 },
    ],
  },
  toad: { width: 92, height: 72, scale: 1.5, sprites: [{ idle: strip('toad-idle.png', 200, 256), hover: strip('toad-tongue.png', 165, 256), left: -216, flip: true }] },
  maxElephant: {
    width: 104,
    height: 68,
    scale: 0.38,
    sprites: [{ idle: strip('max-elephant-idle.png', 200, 384, { h: 224 }), hover: strip('max-elephant-running.png', 100, 384, { h: 224 }), left: -14, flip: true }],
  },
  // Tourné vers la gauche d'origine, il vole sur place ; au survol, la foudre qui étourdit (images de 150 ms en moyenne).
  // `foot` : le bas de la scène frôle ses pattes en vol ; la bande de foudre dessine Nue 31 px plus haut, d'où 31 px
  // de plus pour qu'il reste à la même hauteur et que l'éclair tombe sous la scène.
  nue: {
    width: 72,
    height: 80,
    scale: 0.7,
    sprites: [{ idle: strip('nue-flying.png', 90, 192, { h: 256, foot: 50 }), hover: strip('nue-lightning.png', 150, 192, { h: 256, foot: 81 }), left: -38 }],
  },
  roundDeer: { width: 105, height: 128, scale: 1, sprites: [{ idle: strip('round-deer-idle.png', 200), hover: strip('round-deer-running.png', 80, 128, { zoom: 1.2, foot: 8 }), left: -13 }] },
  divineDogs: {
    width: 122,
    height: 70,
    sprites: [
      { idle: strip('divine-dog-black-idle.png', 200), left: -11, flip: true },
      { idle: strip('divine-dog-white-idle.png', 200), left: 32, delay: 4, flip: true },
    ],
  },
  mahoraga: {
    width: 94,
    height: 128,
    scale: 0.5,
    beside: true,
    sprites: [{ idle: strip('mahoraga-idle.png', 200, 320, { h: 320 }), hover: strip('mahoraga-running.png', 100, 320, { h: 320 }), left: -37 }],
  },
};

/** Bande jouée en boucle à `scale`, les pattes posées sur le bas de la scène. */
export function shikigamiStyle({ file, w, h = FRAME_H, frameMs, zoom = 1, foot = 10 }: Strip, { idle, left, delay = 0, flip = false }: Shikigami, sceneScale = DEFAULT_SCALE): CSSProperties {
  const scale = sceneScale * zoom;
  const width = Math.round(w * scale);
  const height = Math.round(h * scale);
  // Une bande de jet plus large garde le même bord droit en miroir : le corps ne saute pas au survol.
  const flippedOffset = flip ? Math.round(idle.w * scale) - width : 0;
  return {
    left: left + Math.round((w / 2) * (sceneScale - scale)) + flippedOffset,
    bottom: -Math.round(foot * scale),
    width,
    height,
    background: `url(${file}) 0 0 / ${width * FRAMES}px ${height}px no-repeat`,
    animation: `sprite-idle ${FRAMES * frameMs}ms steps(${FRAMES}) ${-delay * frameMs}ms infinite`,
    transform: flip ? 'scaleX(-1)' : undefined,
    '--sprite-end': `-${width * FRAMES}px`,
  } as CSSProperties;
}
