// BON / UI-7: gather Divine Flame at rest; reuse the approved fire arrow on hover.
// Run: npx tsx scripts/prepare-sukuna-flame.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = fileURLToPath(new URL('assets/sukuna/divine-flame-idle-spritesheet.png', import.meta.url));
const output = fileURLToPath(new URL('../public/images/characters/anim/techniques/sukuna/', import.meta.url));
const FRAMES = 16;
const SIZE = 96;
const IDLE_RESOLUTION = 32;

async function cells(file: string, size: number, padding = 0) {
  const { width, height, hasAlpha } = await sharp(file).metadata();
  if (!width || !height || !hasAlpha) throw new Error('Expected a transparent 4 by 4 sprite sheet.');
  return Promise.all(Array.from({ length: FRAMES }, async (_, index) => {
    const col = index % 4, row = Math.floor(index / 4);
    const left = Math.round(col * width / 4), top = Math.round(row * height / 4);
    return sharp(file).extract({ left, top, width: Math.round((col + 1) * width / 4) - left, height: Math.round((row + 1) * height / 4) - top })
      .resize(size - padding * 2, size - padding * 2, { kernel: 'nearest' })
      .extend({ top: padding, bottom: padding, left: padding, right: padding, background: '#0000' })
      .png().toBuffer();
  }));
}

await fs.mkdir(output, { recursive: true });
// Reduce only the idle art to 32 pixels per frame before enlarging for export.
const idlePixels = await cells(source, IDLE_RESOLUTION);
const enlargedIdle = async (size: number, padding = 0) => Promise.all(idlePixels.map((frame) => sharp(frame)
  .resize(size - padding * 2, size - padding * 2, { kernel: 'nearest' })
  .extend({ top: padding, bottom: padding, left: padding, right: padding, background: '#0000' })
  .png().toBuffer()));
const sheet = await enlargedIdle(128);
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#0000' } })
  .composite(sheet.map((input, i) => ({ input, left: i % 4 * 128, top: Math.floor(i / 4) * 128 })))
  .png().toFile(path.join(output, 'divine-flame-idle-spritesheet-lowres.png'));
await fs.writeFile(path.join(output, 'divine-flame-idle-spritesheet-lowres.json'), JSON.stringify({
  image: 'divine-flame-idle-spritesheet-lowres.png', width: 512, height: 512,
  columns: 4, rows: 4, order: 'row-major', transparent: true, frameCount: FRAMES,
  animations: { divineFlamesIdle: { from: 0, to: FRAMES - 1, frameMs: 100, loop: true } },
  frames: Array.from({ length: FRAMES }, (_, index) => ({ index, x: index % 4 * 128, y: Math.floor(index / 4) * 128, w: 128, h: 128 })),
}, null, 2) + '\n');

const idle = await enlargedIdle(SIZE, 4);
const hover = await cells(path.join(output, 'divine-flame-spritesheet-lowres.png'), SIZE, 4);
for (const [variant, frames] of [['idle', idle], ['hover', hover]] as [string, Buffer[]][]) {
  await sharp({ create: { width: SIZE * FRAMES, height: SIZE, channels: 4, background: '#0000' } })
    .composite(frames.map((input, i) => ({ input, left: i * SIZE, top: 0 })))
    .png().toFile(path.join(output, `divine-flame-${variant}.png`));
}

// Preview both states side by side, idle on the left and the approved arrow on the right.
const preview = await Promise.all(idle.map(async (input, i) => sharp({ create: { width: SIZE * 2, height: SIZE, channels: 4, background: '#131315' } })
  .composite([{ input, left: 0, top: 0 }, { input: hover[i], left: SIZE, top: 0 }]).raw().toBuffer()));
await sharp(Buffer.concat(preview), { raw: { width: SIZE * 2, height: SIZE * FRAMES, channels: 4, pageHeight: SIZE } })
  .gif({ delay: 100, loop: 0 }).toFile(path.join(output, 'divine-flame-preview.gif'));
console.log('Prepared Divine Flame idle sheet, idle/hover strips and animation preview.');
