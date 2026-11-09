// BON / UI-7: export generated Yuta VFX to their logical pixel grid and card strips.
// Run: npx tsx scripts/prepare-yuta-effects.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const sourceDir = fileURLToPath(new URL('assets/yuta/', import.meta.url));
const output = fileURLToPath(new URL('../public/images/characters/anim/techniques/yuta/', import.meta.url));
const FRAME_COUNT = 16;
const effects = [
  { id: 'jacobs-ladder', w: 64, h: 128 },
  { id: 'cursed-speech', w: 32, h: 32 },
  { id: 'sky-manipulation', w: 32, h: 32 },
];
await fs.mkdir(output, { recursive: true });

const animations = [];
for (const { id, w, h } of effects) {
  const isLadder = id === 'jacobs-ladder';
  const source = path.join(sourceDir, `${id}${isLadder ? '-pillar' : ''}-spritesheet.png`);
  const { width, height, hasAlpha } = await sharp(source).metadata();
  if (!width || !height || !hasAlpha) throw new Error(`Expected a transparent 4 by 4 atlas: ${source}`);
  const frames = [];
  for (let i = 0; i < FRAME_COUNT; i++) {
    const col = i % 4, row = Math.floor(i / 4);
    const left = Math.round(col * width / 4), top = Math.round(row * height / 4);
    // The pillar uses twice the original grid; its approved coarse impact is reused below.
    const padding = isLadder ? 4 : 2;
    let frame = await sharp(source)
      .extract({ left, top, width: Math.round((col + 1) * width / 4) - left, height: Math.round((row + 1) * height / 4) - top })
      .resize(w - padding * 2, h - padding * 2, { fit: 'fill', kernel: id === 'cursed-speech' ? 'lanczos3' : 'nearest' })
      .extend({ left: padding, right: padding, top: padding, bottom: padding, background: '#0000' })
      .png().toBuffer();
    if (id === 'cursed-speech') {
      // Coverage-aware reduction smears each source stroke over two or three pixels. Keep only
      // the radial coverage peak so every echo stays one logical pixel thick, then make it opaque.
      const coverage = await sharp(frame).ensureAlpha().raw().toBuffer();
      const alpha = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : coverage[(y * w + x) * 4 + 3]);
      let sumX = 0, sumY = 0, sum = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        sumX += alpha(x, y) * x; sumY += alpha(x, y) * y; sum += alpha(x, y);
      }
      const cx = sumX / sum, cy = sumY / sum;
      const pixels = Buffer.alloc(coverage.length);
      let minX = w, minY = h, maxX = -1, maxY = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const a = alpha(x, y);
        if (a < 40) continue;
        const dist = Math.hypot(x - cx, y - cy) || 1;
        const ux = Math.round((x - cx) / dist), uy = Math.round((y - cy) / dist);
        if (a < alpha(x + ux, y + uy) || a < alpha(x - ux, y - uy)) continue;
        const offset = (y * w + x) * 4;
        coverage.copy(pixels, offset, offset, offset + 3);
        pixels[offset + 3] = 255;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
      if (maxX < 0) throw new Error(`Cursed Speech frame ${i} has no visible echo.`);
      // Generated cells have uneven gutters; align the ring centers before playback.
      const shiftX = Math.round((w - 1 - minX - maxX) / 2);
      const shiftY = Math.round((h - 1 - minY - maxY) / 2);
      const centered = Buffer.alloc(pixels.length);
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const offset = (y * w + x) * 4;
        pixels.copy(centered, ((y + shiftY) * w + x + shiftX) * 4, offset, offset + 4);
      }
      frame = await sharp(centered, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
    }
    if (isLadder) {
      const approved = await sharp(path.join(sourceDir, 'jacobs-ladder-approved-impact-strip.png'))
        .extract({ left: i * 32, top: 0, width: 32, height: 64 })
        .resize(w, h, { kernel: 'nearest' }).ensureAlpha().raw().toBuffer();
      const detailed = await sharp(frame).ensureAlpha().raw().toBuffer();
      // Preserve the entire lower third exactly, including the highest curling side lobes.
      // An eight-row blend within the pillar hides the join above the protected impact.
      for (let y = 76; y < h; y++) {
        const weight = Math.min(1, (y - 76) / 8);
        for (let x = 0; x < w; x++) for (let channel = 0; channel < 4; channel++) {
          const offset = (y * w + x) * 4 + channel;
          detailed[offset] = Math.round(detailed[offset] * (1 - weight) + approved[offset] * weight);
        }
      }
      frame = await sharp(detailed, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
    }
    frames.push(frame);
  }
  if (isLadder) {
    const frameDir = path.join(output, 'jacobs-ladder-frames');
    await fs.mkdir(frameDir, { recursive: true });
    await Promise.all(frames.map((frame, i) => fs.writeFile(path.join(frameDir, `frame-${String(i + 1).padStart(2, '0')}.png`), frame)));
  }
  if (isLadder) {
    // Copy RGBA directly: alpha compositing can round translucent approved colors by one level.
    const pixels = await Promise.all(frames.map((frame) => sharp(frame).ensureAlpha().raw().toBuffer()));
    for (const [columns, rows, filename] of [[16, 1, `${id}.png`], [4, 4, `${id}-spritesheet.png`]] as [number, number, string][]) {
      const width = columns * w, height = rows * h;
      const atlas = Buffer.alloc(width * height * 4);
      pixels.forEach((frame, i) => {
        for (let y = 0; y < h; y++) frame.copy(atlas,
          ((Math.floor(i / columns) * h + y) * width + (i % columns) * w) * 4,
          y * w * 4, (y + 1) * w * 4);
      });
      await sharp(atlas, { raw: { width, height, channels: 4 } }).png().toFile(path.join(output, filename));
    }
  } else {
    await sharp({ create: { width: w * FRAME_COUNT, height: h, channels: 4, background: '#0000' } })
      .composite(frames.map((input, i) => ({ input, left: i * w, top: 0 })))
      .png().toFile(path.join(output, `${id}.png`));
    await sharp({ create: { width: w * 4, height: h * 4, channels: 4, background: '#0000' } })
      .composite(frames.map((input, i) => ({ input, left: (i % 4) * w, top: Math.floor(i / 4) * h })))
      .png().toFile(path.join(output, `${id}-spritesheet.png`));
  }
  await fs.writeFile(path.join(output, `${id}.json`), JSON.stringify({
    image: `${id}.png`, sheet: `${id}-spritesheet.png`, frameWidth: w, frameHeight: h,
    frameCount: FRAME_COUNT, frameMs: 100, hoverFrameMs: 65, loop: true, transparent: true,
    frames: frames.map((_, index) => ({ index, x: index * w, y: 0, w, h })),
  }, null, 2) + '\n');

  const previewFrames = await Promise.all(frames.map(async (frame) => {
    const scale = isLadder ? 2 : 4;
    const input = await sharp(frame).resize(w * scale, h * scale, { kernel: 'nearest' }).png().toBuffer();
    return sharp({ create: { width: 160, height: 272, channels: 4, background: '#131315' } })
      .composite([{ input, left: Math.round((160 - w * scale) / 2), top: Math.round((272 - h * scale) / 2) }]).raw().toBuffer();
  }));
  await sharp(Buffer.concat(previewFrames), { raw: { width: 160, height: 272 * FRAME_COUNT, channels: 4, pageHeight: 272 } })
    .gif({ delay: 100, loop: 0 }).toFile(path.join(output, `${id}-preview.gif`));
  animations.push(previewFrames);
}

const combined = [];
for (let i = 0; i < FRAME_COUNT; i++) {
  combined.push(await sharp({ create: { width: 480, height: 272, channels: 4, background: '#131315' } })
    .composite(animations.map((frames, col) => ({ input: frames[i], raw: { width: 160, height: 272, channels: 4 }, left: col * 160, top: 0 })))
    .raw().toBuffer());
}
await sharp(Buffer.concat(combined), { raw: { width: 480, height: 272 * FRAME_COUNT, channels: 4, pageHeight: 272 } })
  .gif({ delay: 100, loop: 0 }).toFile(path.join(output, 'yuta-effects-preview.gif'));
await sharp(combined[4], { raw: { width: 480, height: 272, channels: 4 } }).png().toFile(path.join(output, 'yuta-effects-preview.png'));
// Keep the approved Jacob's Ladder in the character-art library as well as the game assets.
const library = fileURLToPath(new URL('../../charactersAnims/yuta/techniques/', import.meta.url));
await fs.mkdir(library, { recursive: true });
for (const filename of ['jacobs-ladder.png', 'jacobs-ladder-spritesheet.png', 'jacobs-ladder.json', 'jacobs-ladder-preview.gif']) {
  await fs.copyFile(path.join(output, filename), path.join(library, filename));
}
await fs.cp(path.join(output, 'jacobs-ladder-frames'), path.join(library, 'jacobs-ladder-frames'), { recursive: true });
console.log('Prepared 16-frame Yuta effects, atlases, metadata and previews.');
