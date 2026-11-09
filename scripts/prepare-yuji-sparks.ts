// BON / UI-7: slice generated Black Flash art and reuse its frames for Divergent Fist.
// Run: npx tsx scripts/prepare-yuji-sparks.ts [idle-sheet.png] [hover-sheet.png]
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = process.argv[2] ?? fileURLToPath(new URL('assets/yuji/black-flash-spritesheet.png', import.meta.url));
const hoverSource = process.argv[3] ?? fileURLToPath(new URL('assets/yuji/black-flash-hover-spritesheet.png', import.meta.url));
const output = fileURLToPath(new URL('../public/images/characters/anim/techniques/yuji/', import.meta.url));
const SIZE = 96, FRAMES = 16;
async function prepare(source: string, suffix: string) {
  const { width, height, hasAlpha } = await sharp(source).metadata();
  if (!width || !height || width !== height || !hasAlpha) throw new Error('Expected a transparent square 4 by 4 sprite sheet.');
  await fs.mkdir(output, { recursive: true });

  const red = [], cyan = [];
  for (let frame = 0; frame < FRAMES; frame++) {
    const col = frame % 4, row = Math.floor(frame / 4);
    const left = Math.round(col * width / 4), top = Math.round(row * height / 4);
    const cell = await sharp(source).extract({ left, top, width: Math.round((col + 1) * width / 4) - left, height: Math.round((row + 1) * height / 4) - top })
      .resize(44, 44, { kernel: 'nearest' }).ensureAlpha().raw().toBuffer();
    // Explicit nearest-neighbor enlargement keeps every game pixel a sharp 2 by 2 block.
    const data = await sharp(cell, { raw: { width: 44, height: 44, channels: 4 } })
      .resize(88, 88, { kernel: 'nearest' })
      .extend({ top: 4, bottom: 4, left: 4, right: 4, background: '#0000' }).raw().toBuffer();
    red.push(await sharp(data, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toBuffer());
    const recolored = Buffer.from(data);
    for (let i = 0; i < data.length; i += 4) {
      // A 180-degree hue shift preserves brightness, black cores and the exact alpha silhouette.
      const sum = Math.max(data[i], data[i + 1], data[i + 2]) + Math.min(data[i], data[i + 1], data[i + 2]);
      recolored[i] = sum - data[i];
      recolored[i + 1] = sum - data[i + 1];
      recolored[i + 2] = sum - data[i + 2];
    }
    cyan.push(await sharp(recolored, { raw: { width: SIZE, height: SIZE, channels: 4 } }).png().toBuffer());
  }
  for (const [id, frames] of [['black-flash', red], ['divergent-fist', cyan]] as [string, Buffer[]][]) {
    await sharp({ create: { width: SIZE * FRAMES, height: SIZE, channels: 4, background: '#0000' } })
      .composite(frames.map((input, i) => ({ input, left: i * SIZE, top: 0 })))
      .png().toFile(path.join(output, `${id}${suffix}.png`));
  }

  const previews = [];
  for (let i = 0; i < FRAMES; i++) {
    previews.push(await sharp({ create: { width: SIZE * 2, height: SIZE, channels: 4, background: '#131315' } })
      .composite([{ input: red[i], left: 0, top: 0 }, { input: cyan[i], left: SIZE, top: 0 }]).raw().toBuffer());
  }
  await sharp(Buffer.concat(previews), { raw: { width: SIZE * 2, height: SIZE * FRAMES, channels: 4, pageHeight: SIZE } })
    .gif({ delay: suffix ? 55 : 80, loop: 0 }).toFile(path.join(path.dirname(source), `sparks${suffix}-preview.gif`));
  await sharp(previews[6], { raw: { width: SIZE * 2, height: SIZE, channels: 4 } })
    .resize(SIZE * 6, SIZE * 3, { kernel: 'nearest' }).png().toFile(path.join(path.dirname(source), `sparks${suffix}-preview.png`));
  return previews;
}

const idle = await prepare(source, '');
const hover = await prepare(hoverSource, '-hover');
const comparison = idle.map((frame, i) => Buffer.concat([frame, hover[i]]));
await sharp(Buffer.concat(comparison), { raw: { width: SIZE * 2, height: SIZE * 2 * FRAMES, channels: 4, pageHeight: SIZE * 2 } })
  .gif({ delay: 80, loop: 0 }).toFile(path.join(path.dirname(source), 'sparks-comparison.gif'));
await sharp(comparison[6], { raw: { width: SIZE * 2, height: SIZE * 2, channels: 4 } })
  .resize(SIZE * 6, SIZE * 6, { kernel: 'nearest' }).png().toFile(path.join(path.dirname(source), 'sparks-comparison.png'));
console.log('Prepared clean idle and dense hover strips for Black Flash and Divergent Fist, plus comparison previews.');
