import type { CSSProperties } from 'react';
import type { CharacterId } from '@/components/shared/characters';

// Bandes de sprites de public/images/characters/anim/<id>-idle.png et <id>-running.png : 8 images côte à côte.
// `w` × `h` est la taille d'une image dans le fichier ; elle s'affiche à SPRITE_SCALE.
export const SPRITE_SCALE = 0.4;

type FrameSize = { w: number; h: number };

export const SPRITES: Record<CharacterId, { idle: FrameSize; running: FrameSize }> = {
  yuji: { idle: { w: 220, h: 330 }, running: { w: 290, h: 310 } },
  megumi: { idle: { w: 203, h: 320 }, running: { w: 303, h: 311 } },
  nobara: { idle: { w: 201, h: 318 }, running: { w: 294, h: 309 } },
  gojo: { idle: { w: 207, h: 331 }, running: { w: 315, h: 312 } },
  maki: { idle: { w: 195, h: 317 }, running: { w: 300, h: 307 } },
  yuta: { idle: { w: 201, h: 315 }, running: { w: 311, h: 309 } },
  todo: { idle: { w: 202, h: 327 }, running: { w: 318, h: 307 } },
  sukuna: { idle: { w: 203, h: 323 }, running: { w: 289, h: 310 } },
};

/** Dimensions affichées d'une bande : une image (`width` × `height`) et la bande entière (`sheetWidth`). */
export function spriteBox({ w, h }: FrameSize) {
  const width = Math.round(w * SPRITE_SCALE);
  return { width, height: Math.round(h * SPRITE_SCALE), sheetWidth: width * 8 };
}

// Le personnage en pixel art du petit cadre en bas à droite des cartes, réduit à RUNNER_SCALE de la taille du fichier :
// il joue sa bande idle (8 images, comme sur la fiche personnage) et passe à la course (7 images jouées) au survol
// ou au focus de la carte `group` (RUNNER_IDLE / RUNNER_RUN).
const RUNNER_SCALE = 0.196;

export const RUNNER_IDLE = 'group-hover:hidden group-focus-visible:hidden';
export const RUNNER_RUN = 'hidden group-hover:block group-focus-visible:block';

export function runnerIdleStyle(id: CharacterId): CSSProperties {
  const { w, h } = SPRITES[id].idle;
  const width = Math.round(w * RUNNER_SCALE);
  const height = Math.round(h * RUNNER_SCALE);
  return {
    width,
    height,
    background: `url(/images/characters/anim/${id}-idle.png) 0 0 / ${width * 8}px ${height}px no-repeat`,
    animation: 'sprite-idle 0.9s steps(8) infinite',
    '--sprite-end': `-${width * 8}px`,
  } as CSSProperties;
}

export function runnerStyle(id: CharacterId): CSSProperties {
  const { w, h } = SPRITES[id].running;
  const width = Math.round(w * RUNNER_SCALE);
  const height = Math.round(h * RUNNER_SCALE);
  return {
    width,
    height,
    background: `url(/images/characters/anim/${id}-running.png) 0 0 / ${width * 8}px ${height}px no-repeat`,
    animation: 'sprite-running 0.875s steps(7) infinite reverse',
    '--sprite-end': `-${width * 7}px`,
  } as CSSProperties;
}
