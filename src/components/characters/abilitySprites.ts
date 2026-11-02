import type { CSSProperties } from 'react';
import type { AbilityId } from './characterAbilities';

// Shikigami en pixel art dans le coin haut droit des cartes de capacités, tournés vers la droite. Bandes de
// public/images/characters/anim/techniques/ten-shadows/ : 8 images de `w` × 160 côte à côte, pattes à 10 px du bas.
// Comme le sprite de la fiche, ils jouent leur bande idle et passent à `hover` (course, langue…) au survol.
// Une capacité sans entrée n'a pas encore de sprite.
const DIR = '/images/characters/anim/techniques/ten-shadows';
const FRAMES = 8;
const FRAME_H = 160;
const DEFAULT_SCALE = 0.75;

/** `zoom` : agrandit une bande dessinée plus petite que l'idle (autour du centre des pattes) ; `foot` : px vides sous les pattes. */
type Strip = { file: string; w: number; frameMs: number; zoom?: number; foot?: number };

export type Shikigami = {
  idle: Strip;
  /** Bande jouée au survol ; sans elle, le shikigami garde son idle. */
  hover?: Strip;
  /** Bord gauche de l'image dans la scène, en px affichés. */
  left: number;
  /** Décalage de l'animation, en images, pour que les copies d'un même shikigami ne bougent pas ensemble. */
  delay?: number;
};

/** `width` × `height` : place prise dans le coin, en px affichés ; `scale` : taille affichée / taille du fichier. */
export type ShikigamiScene = { width: number; height: number; scale?: number; sprites: readonly Shikigami[] };

const strip = (file: string, frameMs: number, w = 128, { zoom = 1, foot = 10 } = {}): Strip => ({ file: `${DIR}/${file}`, w, frameMs, zoom, foot });

const RABBIT = { idle: strip('rabbit-escape-idle.png', 200), hover: strip('rabbit-escape-running.png', 80) };

export const ABILITY_SPRITES: Partial<Record<AbilityId, ShikigamiScene>> = {
  rabbitEscape: {
    width: 100,
    height: 60,
    sprites: [
      { ...RABBIT, left: -27 },
      { ...RABBIT, left: 1, delay: 3 },
      { ...RABBIT, left: 29, delay: 5 },
    ],
  },
  toad: { width: 92, height: 72, scale: 1.5, sprites: [{ idle: strip('toad-idle.png', 200, 256), hover: strip('toad-tongue.png', 165, 256), left: -72 }] },
  roundDeer: { width: 105, height: 128, scale: 1, sprites: [{ idle: strip('round-deer-idle.png', 200), hover: strip('round-deer-running.png', 80, 128, { zoom: 1.2, foot: 8 }), left: -13 }] },
  divineDogs: {
    width: 122,
    height: 70,
    sprites: [
      { idle: strip('divine-dog-black-idle.png', 200), left: -11 },
      { idle: strip('divine-dog-white-idle.png', 200), left: 32, delay: 4 },
    ],
  },
};

/** Bande jouée en boucle à `scale`, les pattes posées sur le bas de la scène. */
export function shikigamiStyle({ file, w, frameMs, zoom = 1, foot = 10 }: Strip, { left, delay = 0 }: Shikigami, sceneScale = DEFAULT_SCALE): CSSProperties {
  const scale = sceneScale * zoom;
  const width = Math.round(w * scale);
  const height = Math.round(FRAME_H * scale);
  return {
    left: left + Math.round((w / 2) * (sceneScale - scale)),
    bottom: -Math.round(foot * scale),
    width,
    height,
    background: `url(${file}) 0 0 / ${width * FRAMES}px ${height}px no-repeat`,
    animation: `sprite-idle ${FRAMES * frameMs}ms steps(${FRAMES}) ${-delay * frameMs}ms infinite`,
    '--sprite-end': `-${width * FRAMES}px`,
  } as CSSProperties;
}
