// BON / UI-7: deterministic pixel effects for ability cards. Run with Node; sharp is already installed.
// Optional: --preview /absolute/path.gif exports idle (top) and hover (bottom); --orbs skips the nails.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SIZE = 64, FRAME = 96, FRAMES = 16, ORB_FRAMES = 32, ORB_MS = 50, FUSION_MS = 90, TAU = Math.PI * 2;
const ROOT = fileURLToPath(new URL('../public/images/characters/anim/techniques', import.meta.url));
const PALETTES = {
  blue: ['#091c58', '#0754e3', '#008bff', '#24d9ff', '#8cf4ff', '#efffff'],
  red: ['#4a0828', '#a90032', '#fa1645', '#ff584e', '#ffa59b', '#fff1e9'],
  purple: ['#260d50', '#5912b6', '#972bff', '#c167ff', '#e9b1ff', '#fff0ff'],
};
type Kind = keyof typeof PALETTES;
type Point = [number, number];
const rgb = (hex: string) => (hex.slice(1).match(/../g) ?? []).map((n) => parseInt(n, 16));

type Canvas = ReturnType<typeof canvas>;

function canvas() {
  const data = Buffer.alloc(SIZE * SIZE * 4);
  function pixel(x: number, y: number, color: string, alpha = 1) {
    x = Math.round(x); y = Math.round(y);
    if (x < 1 || y < 1 || x >= SIZE - 1 || y >= SIZE - 1) return;
    const i = (y * SIZE + x) * 4, a = Math.max(0, Math.min(1, alpha));
    if (a === 0) return;
    const old = data[i + 3] / 255, total = a + old * (1 - a);
    const c = rgb(color);
    for (let j = 0; j < 3; j++) data[i + j] = (c[j] * a + data[i + j] * old * (1 - a)) / total;
    data[i + 3] = total * 255;
  }
  function line(x1: number, y1: number, x2: number, y2: number, color: string, alpha = 1) {
    const steps = Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)));
    for (let i = 0; i <= steps; i++) {
      const t = steps ? i / steps : 0;
      pixel(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, color, alpha);
    }
  }
  function arc(cx: number, cy: number, radius: number, start: number, length: number, color: string, squash = 1, tilt = 0, alpha = 1) {
    const count = Math.ceil(Math.abs(length * radius) * 2);
    for (let i = 0; i <= count; i++) {
      const a = start + length * i / count;
      const x = Math.cos(a) * radius, y = Math.sin(a) * radius * squash;
      pixel(cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt), color, alpha);
    }
  }
  function composite(layer: Buffer, opacity = 1) {
    for (let i = 0; i < layer.length; i += 4) {
      if (!layer[i + 3]) continue;
      const color = `#${layer.subarray(i, i + 3).toString('hex')}`;
      pixel((i / 4) % SIZE, Math.floor(i / 4 / SIZE), color, layer[i + 3] / 255 * opacity);
    }
  }
  return { data, pixel, line, arc, composite };
}

function spark(c: Canvas, x: number, y: number, color: string, length = 2) {
  c.line(x - length, y, x + length, y, color);
  c.line(x, y - length, x, y + length, color);
  c.pixel(x, y, '#fff8ff');
}

function sphere(c: Canvas, cx: number, cy: number, radius: number, palette: string[], t: number, corona = 9) {
  // The references have white-hot energy, a saturated corona and an unstable, flame-like silhouette.
  // All time terms are whole turns, so the procedural turbulence also loops at the strip boundary.
  const phase = t * TAU;
  for (let y = Math.floor(cy - radius - 11); y <= cy + radius + 11; y++) {
    for (let x = Math.floor(cx - radius - 11); x <= cx + radius + 11; x++) {
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      const flame = Math.sin(a * 7 + phase) * 1.2 + Math.sin(a * 13 - phase * 2) * 0.7 + Math.sin(a * 19 + phase * 3) * 0.4;
      const edge = radius + flame, fraction = d / edge;
      if (d > edge + corona) continue;
      if (fraction > 1) {
        const glow = Math.pow(Math.max(0, 1 - (d - edge) / corona), 2);
        c.pixel(x, y, palette[2], glow * 0.28);
        continue;
      }
      const flow = Math.sin(dx * 0.6 + Math.sin(dy * 0.45 + phase) * 2 - phase * 2);
      const shade = fraction < 0.63 ? 5 : fraction < 0.8 ? 4 : fraction < 0.94 ? 3 : 2;
      c.pixel(x, y, palette[shade]);
      // Pale moving eddies break up the core without turning it into a shaded solid ball.
      if (fraction > 0.45 && fraction < 0.9 && flow > 0.55) c.pixel(x, y, palette[5], 0.75);
      if (fraction < 0.55 && flow < -0.8) c.pixel(x, y, palette[4], 0.22);
    }
  }
}

function ribbon(c: Canvas, cx: number, cy: number, radius: number, t: number, offset: number, palette: string[], front: boolean) {
  const phase = t * TAU, tilt = -0.32;
  let previous: Point | undefined;
  for (let i = 0; i <= 100; i++) {
    const u = i / 100, a = u * TAU + offset + phase;
    // Curved, uneven strands slide over and behind the orb, like the hand-wound light in reference 4.
    if ((Math.sin(a) > 0) !== front) { previous = undefined; continue; }
    const wave = Math.sin(a * 3 + offset - phase * 2);
    const x = Math.cos(a) * (radius + 3 + wave * 1.3);
    const y = Math.sin(a) * (radius * 0.37) + Math.sin(a * 2 + phase) * 1.1;
    const point: Point = [cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt) + Math.sin(offset) * radius * 0.53];
    if (previous) {
      c.line(previous[0], previous[1] + 1, point[0], point[1] + 1, palette[3], front ? 0.7 : 0.35);
      c.line(previous[0], previous[1], point[0], point[1], palette[front ? 5 : 4], front ? 0.85 : 0.55);
    }
    previous = point;
  }
}

function tendrils(c: Canvas, cx: number, cy: number, radius: number, t: number, hover: boolean, kind: Kind) {
  const p = PALETTES[kind], phase = t * TAU;
  for (let i = 0; i < (hover ? 11 : 7); i++) {
    const angle = i * 2.399 + Math.sin(phase + i) * 0.12;
    const extent = (hover ? 11 : 7) + Math.sin(phase + i * 2) * 2;
    let previous: Point | undefined;
    for (let j = 0; j <= 24; j++) {
      const u = j / 24, r = radius - 2 + u * extent;
      const curl = angle + Math.sin(u * 5 + phase * (kind === 'blue' ? -1 : 1) + i) * u * 0.34;
      const point: Point = [cx + Math.cos(curl) * r, cy + Math.sin(curl) * r];
      if (previous) {
        // A dark, twisting seam backed by cyan/red/violet light echoes the cursed wisps in reference 3.
        c.line(previous[0] + 1, previous[1], point[0] + 1, point[1], p[3], (1 - u) * 0.8);
        c.line(previous[0], previous[1], point[0], point[1], i % 3 ? p[4] : p[0], (1 - u) * 0.9);
      }
      previous = point;
    }
  }
}

function redEjection(c: Canvas, radius: number, t: number, hover: boolean) {
  const p = PALETTES.red;
  // Every packet travels away from the core. Its bright head leads an inward-pointing, tapered tail.
  const count = hover ? 15 : 10;
  for (let i = 0; i < count; i++) {
    const travel = (t * 2 + i / count) % 1;
    const angle = i * 2.399;
    const r = radius - 1 + travel * (30 - radius);
    const alpha = Math.sin(Math.PI * travel) ** 0.6;
    const length = (hover ? 7 : 5) * (0.5 + travel * 0.5);
    for (let j = 0; j <= 12; j++) {
      const u = j / 12, d = r - length * (1 - u);
      const x = 32 + Math.cos(angle) * d, y = 32 + Math.sin(angle) * d;
      c.pixel(x, y, u > 0.8 ? p[5] : p[3], alpha * (0.2 + u * 0.8));
      if (hover && u > 0.55) c.pixel(x + Math.sin(angle), y - Math.cos(angle), p[2], alpha * 0.75);
    }
    const x = 32 + Math.cos(angle) * r, y = 32 + Math.sin(angle) * r;
    c.pixel(x, y, p[5], alpha);
    // Detached, angular chunks make the outward travel visible at card size.
    if (i % 2 === 0 || hover) {
      c.line(x - Math.sin(angle), y + Math.cos(angle), x + Math.sin(angle), y - Math.cos(angle), p[4], alpha);
      c.pixel(x + Math.cos(angle), y + Math.sin(angle), p[5], alpha);
      if (hover) c.pixel(x - Math.cos(angle), y - Math.sin(angle), p[3], alpha);
    }
  }
  for (let i = 0; i < 2; i++) {
    const wave = (t * 2 + i * 0.5) % 1;
    const opacity = Math.sin(wave * Math.PI) * (hover ? 0.4 : 0.2);
    c.arc(32, 32, radius + wave * (29 - radius), 0, TAU, p[3], 1, 0, opacity);
  }
}

const smooth = (value: number) => { const x = Math.max(0, Math.min(1, value)); return x * x * (3 - 2 * x); };

function fusion(t: number) {
  const c = canvas();
  const converge = smooth(t / 0.43);
  const form = smooth((t - 0.24) / 0.23);
  const reset = smooth((t - 0.86) / 0.14);
  const pair = canvas();
  const separation = 16 * (1 - converge);
  const tilt = Math.sin(converge * Math.PI) * 4;
  for (const [side, palette] of [[-1, PALETTES.blue], [1, PALETTES.red]] as [number, string[]][]) {
    const x = 32 + side * separation, y = 32 + side * tilt;
    const radius = 7.3 + converge * 1.2;
    sphere(pair, x, y, radius, palette, t, 5);
    ribbon(pair, x, y, radius - 1, t, side, palette, true);
  }
  c.composite(pair.data, (1 - form) * (1 - reset));
  if (form > 0) {
    const purple = canvas();
    const radius = 16 * Math.sqrt(form);
    tendrils(purple, 32, 32, radius, t, true, 'purple');
    sphere(purple, 32, 32, radius, PALETTES.purple, t);
    for (let i = 0; i < 5; i++) ribbon(purple, 32, 32, radius, t, i * 1.5, PALETTES.purple, true);
    // The collision emits one expanding violet pulse before the finished orb settles.
    if (t > 0.4 && t < 0.72) {
      const pulse = (t - 0.4) / 0.32;
      purple.arc(32, 32, 15 + pulse * 14, 0, TAU, PALETTES.purple[4], 1, 0, Math.sin(pulse * Math.PI) * 0.8);
    }
    c.composite(purple.data, form * (1 - reset));
  }
  if (reset > 0) {
    // Crossfade back to the two separated sources so the next fusion starts without a jump.
    const sources = canvas();
    for (const [side, palette] of [[-1, PALETTES.blue], [1, PALETTES.red]] as [number, string[]][]) {
      sphere(sources, 32 + side * 16, 32, 7.3, palette, t, 5);
      ribbon(sources, 32 + side * 16, 32, 6.3, t, side, palette, true);
    }
    c.composite(sources.data, reset);
  }
  return c.data;
}

function orb(kind: Kind, t: number, hover: boolean) {
  if (kind === 'purple' && hover) return fusion(t);
  const c = canvas(), p = PALETTES[kind], phase = t * TAU;
  const cy = 32 + Math.sin(phase) * 0.65;
  const radius = (kind === 'purple' ? 16 : 15) + Math.sin(phase) * 0.45 + (hover ? 1 : 0);
  if (kind === 'red') {
    sphere(c, 32, 32, radius - (hover ? 1 : 0), p, t);
    redEjection(c, radius, t, hover);
    return c.data;
  }
  for (let i = 0; i < 4; i++) ribbon(c, 32, cy, radius, t, i * 1.5, p, false);
  tendrils(c, 32, cy, radius, t, hover, kind);
  sphere(c, 32, cy, radius, p, t);
  for (let i = 0; i < (hover ? 6 : 4); i++) ribbon(c, 32, cy, radius, t, i * 1.5, p, true);
  // Drifting motes converge for Blue and stream away from Red, without detached planetary rings.
  for (let i = 0; i < (hover ? 11 : 6); i++) {
    const travel = (t + i / 11) % 1, inward = kind === 'blue';
    const r = radius + 4 + (inward ? 1 - travel : travel) * 7;
    const angle = i * 2.399 + Math.sin(phase) * 0.08;
    const alpha = Math.sin(travel * Math.PI);
    c.pixel(32 + Math.cos(angle) * r, cy + Math.sin(angle) * r, p[4], alpha * 0.8);
  }
  if (hover) {
    spark(c, 18 + Math.cos(phase) * 3, 15 + Math.sin(phase) * 2, p[4], 1);
    spark(c, 48 + Math.sin(phase) * 3, 47 + Math.cos(phase) * 3, p[3], 1);
  }
  return c.data;
}

function nail(c: Canvas, cx: number, cy: number, angle: number, scale = 1) {
  const point = (x: number, y: number): Point => [cx + (x * Math.cos(angle) - y * Math.sin(angle)) * scale, cy + (x * Math.sin(angle) + y * Math.cos(angle)) * scale];
  const line = (x1: number, y1: number, x2: number, y2: number, color: string) => c.line(...point(x1, y1), ...point(x2, y2), color);
  // Flat forged head, bevelled steel shaft and a sharply tapered point.
  for (let x = -3; x <= 3; x++) line(x, -15, x, 12 - Math.abs(x) * 1.5, ['#1a1a30', '#4b4f6b', '#a9b6cf', '#e6eaf5', '#7a87a3', '#3a405a', '#16182a'][x + 3]);
  line(-3, 12, 0, 19, '#7684a0'); line(0, 12, 0, 19, '#e6eaf5'); line(3, 12, 0, 19, '#3a405a');
  for (let y = -17; y <= -13; y++) line(-7, y, 7, y, y === -17 ? '#ebedf8' : y === -16 ? '#a5b2ca' : y === -13 ? '#16182a' : '#535e7e');
  line(-6, -16, -6, -14, '#c5d0e0');
}

function cursedNail(kind: string, t: number, hover: boolean) {
  const c = canvas(), phase = t * TAU, p = PALETTES.purple;
  const impact = hover && kind === 'hairpin';
  const strike = impact ? Math.sin(phase) * 4 : 0;
  const cx = 32 + strike, cy = 31 + Math.sin(phase) * 1.5 + strike;
  // Cursed energy curls behind the iron, leaving its silhouette readable.
  for (let i = 0; i < 3; i++) c.arc(cx, cy, 15 + i * 4, phase + i * 2.1, 1.65, p[2 + i], 0.6, -0.7, hover ? 0.8 : 0.35);
  if (hover && kind === 'resonance') {
    for (let i = 0; i < 3; i++) {
      const wave = (t + i / 3) % 1;
      c.arc(cx, cy, 9 + wave * 20, 0, TAU, '#f29adb', 0.8, 0, (1 - wave) * 0.8);
    }
  }
  if (impact) {
    // Hairpin detonates from the nail's point, with jagged rose/violet shards.
    const burst = (t * 2) % 1;
    for (let i = 0; i < 9; i++) {
      const a = i * TAU / 9;
      const d = 3 + burst * 15, tail = 4 * (1 - burst);
      c.line(43 + Math.cos(a) * d, 43 + Math.sin(a) * d, 43 + Math.cos(a) * (d + tail), 43 + Math.sin(a) * (d + tail), i % 2 ? '#f77fce' : '#c8a5ff', 1 - burst);
    }
  }
  nail(c, cx, cy, -0.68 + Math.sin(phase) * 0.035);
  c.arc(cx, cy, 12, -phase + 0.8, 2.3, '#e091f9', 0.42, -0.7, hover ? 1 : 0.6);
  for (let i = 0; i < 5; i++) {
    const a = i * 2.4 + phase * 0.4, r = 23 + Math.sin(phase + i) * 2;
    c.pixel(cx + Math.cos(a) * r, cy + Math.sin(a) * r, i % 2 ? '#f8b3df' : '#b370f5', 0.7);
  }
  spark(c, cx - 9, cy - 12, '#f5d0f6', hover ? 2 : 1);
  return c.data;
}

async function main() {
  const ids = process.argv.includes('--orbs') ? ['blue', 'red', 'purple'] : ['blue', 'red', 'purple', 'resonance', 'hairpin'];
  const previews = [];
  for (const id of ids) {
    const count = id in PALETTES ? ORB_FRAMES : FRAMES;
    const dir = path.join(ROOT, id in PALETTES ? 'limitless' : 'straw-doll');
    await fs.mkdir(dir, { recursive: true });
    for (const hover of [false, true]) {
      const frames = [];
      for (let i = 0; i < count; i++) {
        const data = id in PALETTES ? orb(id as Kind, i / count, hover) : cursedNail(id, i / count, hover);
        frames.push(await sharp(data, { raw: { width: SIZE, height: SIZE, channels: 4 } }).resize(FRAME, FRAME, { kernel: 'nearest' }).png().toBuffer());
      }
      const name = `${id}-${hover ? 'hover' : 'idle'}.png`;
      await sharp({ create: { width: FRAME * count, height: FRAME, channels: 4, background: '#0000' } })
        .composite(frames.map((input, i) => ({ input, left: i * FRAME, top: 0 }))).png().toFile(path.join(dir, name));
      previews.push({ id, hover, frames, frameMs: id === 'purple' && hover ? FUSION_MS : id in PALETTES ? ORB_MS : 90 });
    }
  }
  const preview = process.argv.indexOf('--preview');
  if (preview !== -1) {
    const frames = [];
    const previewFrames = Math.ceil(Math.max(...previews.map((p) => p.frames.length * p.frameMs)) / ORB_MS);
    for (let i = 0; i < previewFrames; i++) {
      frames.push(await sharp({ create: { width: FRAME * ids.length, height: FRAME * 2, channels: 4, background: '#131315' } })
        .composite(previews.map((p) => ({ input: p.frames[Math.floor(i * ORB_MS / p.frameMs) % p.frames.length], left: ids.indexOf(p.id) * FRAME, top: p.hover ? FRAME : 0 }))).raw().toBuffer());
    }
    await sharp(Buffer.concat(frames), { raw: { width: FRAME * ids.length, height: FRAME * 2 * previewFrames, channels: 4, pageHeight: FRAME * 2 } }).gif({ delay: ORB_MS, loop: 0 }).toFile(process.argv[preview + 1]);
  }
  console.log(`Generated ${ids.length * 2} technique strips (orbs: ${ORB_FRAMES} frames, ${ORB_MS} ms/frame).`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
