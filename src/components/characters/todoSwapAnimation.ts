/** Approved Clean Echo: pixel rings rising from the feet, wide at the waist (BON, UI-4). */
export const TODO_SWAP_MS = 680;
export const TODO_SWAP_AT = 0.56;

type EchoRing = { y: number; radius: number; opacity: number; leading: boolean };
export type TodoSwapFrame = { rings: EchoRing[]; flash: number };

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

/** Pure animation geometry, shared by both character positions and both depth layers. */
export function todoSwapFrame(progress: number, bodyWidth: number, height: number): TodoSwapFrame {
  const rings: EchoRing[] = [];
  const waist = height * 0.56;
  const baseRadius = bodyWidth * 1.04;
  const flash = 1 - smooth(Math.abs(progress - TODO_SWAP_AT) / 0.065);
  if (progress < 0 || progress >= 1) return { rings, flash: 0 };

  if (progress >= TODO_SWAP_AT) {
    for (let i = 0; i < 3; i++) {
      const age = (progress - TODO_SWAP_AT - i * 0.035) / 0.24;
      if (age < 0 || age >= 1) continue;
      rings.push({
        y: waist,
        radius: baseRadius * (0.12 + age * 0.70),
        opacity: (0.66 - i * 0.13) * Math.pow(1 - age, 1.7),
        leading: i === 0,
      });
    }
  } else {
    for (let i = 0; i < 8; i++) {
      const level = i / 7;
      const start = 0.27 + (1 - level) * 0.065;
      const collapse = smooth((progress - start) / (TODO_SWAP_AT - start));
      const spread = 1 - collapse;
      const appear = smooth((progress - level * 0.13) / 0.075);
      rings.push({
        y: waist + (height - 3 - waist) * (1 - level) * spread,
        radius: baseRadius * (0.18 + level * 0.82) * spread,
        opacity: (i === 7 ? 0.98 : 0.36 + level * 0.40) * appear * (1 - collapse * 0.72),
        leading: i === 7,
      });
    }
  }
  return { rings, flash };
}

const BLUE = '#45a9ff';
const CORE = '#ccecff';

/** Integer pixel cells keep the ring outlines sharp, including on Retina screens. */
export function drawTodoSwapLayer(
  context: CanvasRenderingContext2D,
  frame: TodoSwapFrame,
  width: number,
  height: number,
  bodyWidth: number,
  front: boolean,
) {
  const pixel = Math.max(1, Math.round(bodyWidth / 40));
  const center = Math.round(width / 2 / pixel);
  context.clearRect(0, 0, width, height + 4);
  for (const ring of frame.rings) {
    if (ring.radius < pixel || ring.opacity <= 0) continue;
    const cy = Math.round(ring.y / pixel);
    const rx = Math.max(1, Math.round(ring.radius / pixel));
    const ry = Math.max(1, Math.round(ring.radius * 0.18 / pixel));
    const samples = Math.ceil(rx * Math.PI * 2);
    const cells = new Set<string>();
    for (let i = 0; i <= samples; i++) {
      const angle = (front ? 0 : Math.PI) + i / samples * Math.PI;
      cells.add(`${center + Math.round(Math.cos(angle) * rx)},${cy + Math.round(Math.sin(angle) * ry)}`);
    }
    context.globalAlpha = ring.opacity;
    context.fillStyle = ring.leading ? CORE : BLUE;
    for (const cell of cells) {
      const [x, y] = cell.split(',').map(Number);
      context.fillRect(x * pixel, y * pixel, pixel, pixel);
    }
  }
  if (front && frame.flash > 0) {
    const x = center * pixel;
    const y = Math.round(height * 0.56 / pixel) * pixel;
    const half = Math.max(pixel, Math.round(bodyWidth / 81 * 16 * frame.flash / pixel) * pixel);
    context.globalAlpha = frame.flash;
    context.fillStyle = BLUE;
    context.fillRect(x - half, y - pixel * 2, half * 2, pixel * 4);
    context.fillRect(x - pixel * 2, y - pixel * 4, pixel * 4, pixel * 8);
    context.fillStyle = '#e4f5ff';
    context.fillRect(x - half + pixel, y - pixel, Math.max(pixel, half * 2 - pixel * 2), pixel * 2);
    context.fillRect(x - pixel, y - pixel * 3, pixel * 2, pixel * 6);
  }
  context.globalAlpha = 1;
}
