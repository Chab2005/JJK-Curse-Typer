import type { CSSProperties } from 'react';
import type { AbilityId } from './characterAbilities';

// Shikigami en pixel art dans le coin haut droit des cartes de capacités, tournés vers la droite sauf `flip`. Bandes de
// public/images/characters/anim/techniques/ten-shadows/ : `frames` images de `w` × `h` côte à côte (8 par défaut), pattes à 10 px du bas.
// Comme le sprite de la fiche, ils jouent leur bande idle et passent à `hover` (course, langue…) au survol.
// Orbes et clous : bandes carrées dans limitless/ et straw-doll/. Une capacité sans entrée n'a pas encore de sprite.
const DIR = '/images/characters/anim/techniques/ten-shadows';
const FRAMES = 8;
const FRAME_H = 160;
const DEFAULT_SCALE = 0.75;

/** `zoom` : agrandit une bande dessinée plus petite que l'idle (autour du centre des pattes) ; `foot` : px vides sous les pattes. */
type Strip = { file: string; w: number; h?: number; frames?: number; frameMs: number; zoom?: number; foot?: number };

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
 *  `beside` : le titre, l'effet et le pied de carte restent en colonne à gauche, le shikigami centré seul sur toute la hauteur à droite. */
export type ShikigamiScene = { width: number; height: number; scale?: number; beside?: boolean; sprites: readonly Shikigami[] };

const strip = (file: string, frameMs: number, w = 128, { zoom = 1, foot = 10, h = FRAME_H, frames = FRAMES } = {}): Strip => ({ file: `${DIR}/${file}`, w, h, frames, frameMs, zoom, foot });

const RABBIT = { idle: strip('rabbit-escape-idle.png', 200), hover: strip('rabbit-escape-running.png', 80) };

/** Orbs and cursed nails share a square canvas: their particles stay inside the reserved corner. */
const effect = (folder: string, id: string, frames = 16, frameMs = 90, hoverFrameMs = frameMs): ShikigamiScene => ({
  width: 96,
  height: 96,
  scale: 1,
  sprites: [{
    left: 0,
    idle: { file: `/images/characters/anim/techniques/${folder}/${id}-idle.png`, w: 96, h: 96, frames, frameMs, foot: 0 },
    hover: { file: `/images/characters/anim/techniques/${folder}/${id}-hover.png`, w: 96, h: 96, frames, frameMs: hoverFrameMs, foot: 0 },
  }],
});

/** Yuji's sparks share their colors and timing; hover uses the denser original generation. */
const spark = (id: string): ShikigamiScene => {
  const animation: Strip = { file: `/images/characters/anim/techniques/yuji/${id}.png`, w: 96, h: 96, frames: 16, frameMs: 80, foot: 0 };
  return {
    width: 96,
    height: 96,
    scale: 1,
    sprites: [{ left: 0, idle: animation, hover: { ...animation, file: animation.file.replace('.png', '-hover.png'), frameMs: 55 } }],
  };
};

export const ABILITY_SPRITES: Partial<Record<AbilityId, ShikigamiScene>> = {
  divergentFist: spark('divergent-fist'),
  blackFlash: spark('black-flash'),
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
      { idle: strip('divine-dog-black-idle.png', 200), hover: strip('divine-dog-black-running.png', 80), left: -11, flip: true },
      { idle: strip('divine-dog-white-idle.png', 200), hover: strip('divine-dog-white-running.png', 80, 160), left: 32, delay: 4, flip: true },
    ],
  },
  // Course de 9 images sur 800 ms : l'image où la lame passait au bras arrière a été retirée.
  mahoraga: {
    width: 170,
    height: 232,
    scale: 0.9,
    beside: true,
    sprites: [{ idle: strip('mahoraga-idle.png', 200, 320, { h: 320 }), hover: strip('mahoraga-running.png', 800 / 9, 320, { h: 320, frames: 9 }), left: -67 }],
  },
  blue: effect('limitless', 'blue', 32, 50),
  red: effect('limitless', 'red', 32, 50),
  purple: effect('limitless', 'purple', 32, 50, 90),
  resonance: effect('straw-doll', 'resonance'),
  hairpin: effect('straw-doll', 'hairpin'),
};

/** Bande jouée en boucle à `scale`, les pattes posées sur le bas de la scène. */
export function shikigamiStyle({ file, w, h = FRAME_H, frames = FRAMES, frameMs, zoom = 1, foot = 10 }: Strip, { idle, left, delay = 0, flip = false }: Shikigami, sceneScale = DEFAULT_SCALE): CSSProperties {
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
    background: `url(${file}) 0 0 / ${width * frames}px ${height}px no-repeat`,
    animation: `sprite-idle ${frames * frameMs}ms steps(${frames}) ${-delay * frameMs}ms infinite`,
    transform: flip ? 'scaleX(-1)' : undefined,
    '--sprite-end': `-${width * frames}px`,
  } as CSSProperties;
}
