// BON / UI-7: one short transformation between the approved idle and hover loops.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = fileURLToPath(new URL('assets/sukuna/divine-flame-transition-spritesheet.png', import.meta.url));
const output = fileURLToPath(new URL('../public/images/characters/anim/techniques/sukuna/', import.meta.url));
const { width, height, hasAlpha } = await sharp(source).metadata();
if (!width || !height || !hasAlpha) throw new Error('Expected a transparent four-column, two-row sheet.');
const SIZE = 96, COUNT = 8;
const frames = await Promise.all(Array.from({ length: COUNT }, async (_, i) => {
  // Exact approved endpoints avoid a jump as the hover loop begins.
  if (i === 0 || i === COUNT - 1) return sharp(path.join(output, `divine-flame-${i === 0 ? 'idle' : 'hover'}.png`))
    .extract({ left: 0, top: 0, width: SIZE, height: SIZE }).png().toBuffer();
  const col = i % 4, row = Math.floor(i / 4), left = Math.round(col * width / 4), top = Math.round(row * height / 2);
  const pixels = await sharp(source).extract({ left, top, width: Math.round((col + 1) * width / 4) - left, height: Math.round((row + 1) * height / 2) - top })
    .resize(32, 32, { kernel: 'nearest' }).png().toBuffer();
  return sharp(pixels).resize(88, 88, { kernel: 'nearest' })
    .extend({ top: 4, bottom: 4, left: 4, right: 4, background: '#0000' }).png().toBuffer();
}));
// Copy RGBA rows directly so compositing cannot round translucent endpoint colors.
const rawFrames = await Promise.all(frames.map((frame) => sharp(frame).ensureAlpha().raw().toBuffer()));
const stripPixels = Buffer.alloc(SIZE * COUNT * SIZE * 4);
for (let y = 0; y < SIZE; y++) for (let i = 0; i < COUNT; i++) {
  rawFrames[i].copy(stripPixels, (y * SIZE * COUNT + i * SIZE) * 4, y * SIZE * 4, (y + 1) * SIZE * 4);
}
await sharp(stripPixels, { raw: { width: SIZE * COUNT, height: SIZE, channels: 4 } })
  .png().toFile(path.join(output, 'divine-flame-transition.png'));
const sheetFrames = await Promise.all(frames.map((frame) => sharp(frame).resize(128, 128, { kernel: 'nearest' }).png().toBuffer()));
await sharp({ create: { width: 512, height: 256, channels: 4, background: '#0000' } })
  .composite(sheetFrames.map((input, i) => ({ input, left: i % 4 * 128, top: Math.floor(i / 4) * 128 })))
  .png().toFile(path.join(output, 'divine-flame-transition-spritesheet-lowres.png'));
await fs.writeFile(path.join(output, 'divine-flame-transition-spritesheet-lowres.json'), JSON.stringify({
  image: 'divine-flame-transition-spritesheet-lowres.png', width: 512, height: 256,
  columns: 4, rows: 2, frameCount: COUNT, order: 'row-major', transparent: true,
  frameMs: 60, durationMs: COUNT * 60, loop: false, next: 'divine-flame-hover.png',
  frames: Array.from({ length: COUNT }, (_, index) => ({ index, x: index % 4 * 128, y: Math.floor(index / 4) * 128, w: 128, h: 128 })),
}, null, 2) + '\n');
const sequence = [], delays = [];
for (const [variant, count, delay] of [['idle', 8, 100], ['transition', COUNT, 60], ['hover', 16, 70]]) {
  for (let i = 0; i < count; i++) {
    const frame = variant === 'transition' ? frames[i] : await sharp(path.join(output, `divine-flame-${variant}.png`))
      .extract({ left: i * SIZE, top: 0, width: SIZE, height: SIZE }).png().toBuffer();
    sequence.push(await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: '#131315' } })
      .composite([{ input: frame, left: 0, top: 0 }]).resize(192, 192, { kernel: 'nearest' }).raw().toBuffer());
    delays.push(delay);
  }
}
await sharp(Buffer.concat(sequence), { raw: { width: 192, height: 192 * sequence.length, channels: 4, pageHeight: 192 } })
  .gif({ delay: delays, loop: 0 }).toFile(path.join(output, 'divine-flame-transition-preview.gif'));
console.log('Prepared eight transition frames (480 ms), atlas and idle → transition → arrow preview.');
