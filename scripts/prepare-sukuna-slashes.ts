// BON / UI-7: cut Cleave (frames 0-7) and Dismantle (frames 8-15) into the strips of their ability cards.
// Run: npx tsx scripts/prepare-sukuna-slashes.ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const output = fileURLToPath(new URL('../public/images/characters/anim/techniques/sukuna/', import.meta.url));
const source = path.join(output, 'cleave-dismantle-spritesheet-lowres.png');
const FRAMES = 8;
const SIZE = 96;
const PADDING = 4;

const { width, height } = await sharp(source).metadata();
const cell = (index: number) => {
  const col = index % 4, row = Math.floor(index / 4);
  const left = Math.round(col * width / 4), top = Math.round(row * height / 4);
  return sharp(source).extract({ left, top, width: Math.round((col + 1) * width / 4) - left, height: Math.round((row + 1) * height / 4) - top })
    .resize(SIZE - PADDING * 2, SIZE - PADDING * 2, { kernel: 'nearest' })
    .extend({ top: PADDING, bottom: PADDING, left: PADDING, right: PADDING, background: '#0000' })
    .png().toBuffer();
};

for (const [id, first] of [['cleave', 0], ['dismantle', 8]] as [string, number][]) {
  const frames = await Promise.all(Array.from({ length: FRAMES }, (_, i) => cell(first + i)));
  await sharp({ create: { width: SIZE * FRAMES, height: SIZE, channels: 4, background: '#0000' } })
    .composite(frames.map((input, i) => ({ input, left: i * SIZE, top: 0 })))
    .png().toFile(path.join(output, `${id}.png`));
}
console.log('Prepared Cleave and Dismantle strips.');
