import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { ABILITY_SPRITES, shikigamiStyle } from '@/components/characters/abilitySprites';

describe('Yuji’s pixel sparks', () => {
  it.each(['blackFlash', 'divergentFist'] as const)('plays %s inside its reserved card space, faster on hover', async (id) => {
    const scene = ABILITY_SPRITES[id];
    expect(scene).toBeDefined();
    const sprite = scene!.sprites[0];
    expect(sprite.hover!.file).toBe(sprite.idle.file.replace('.png', '-hover.png'));
    expect(sprite.hover!.frameMs).toBeLessThan(sprite.idle.frameMs);
    for (const strip of [sprite.idle, sprite.hover!]) {
      const { data, info } = await sharp(path.join('public', strip.file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      expect([info.width, info.height]).toEqual([96 * 16, 96]);
      const frames = Array.from({ length: 16 }, (_, frame) => {
        const rows = [];
        for (let y = 0; y < 96; y++) {
          const start = (y * info.width + frame * 96) * 4;
          const row = data.subarray(start, start + 96 * 4);
          expect(row[3]).toBe(0);
          expect(row[95 * 4 + 3]).toBe(0);
          if (y === 0 || y === 95) expect(row.every((value, i) => i % 4 !== 3 || value === 0)).toBe(true);
          rows.push(row);
        }
        return Buffer.concat(rows).toString('base64');
      });
      expect(new Set(frames).size).toBe(16);
    }
    const style = shikigamiStyle(sprite.idle, sprite, scene!.scale);
    expect([style.width, style.height]).toEqual([scene!.width, scene!.height]);
    expect(Math.abs(Number(style.bottom))).toBe(0);
    expect(style.animation).toContain('steps(16)');
  });

  it.each(['blackFlash', 'divergentFist'] as const)('uses the result with substantially more sparks on hover for %s', async (id) => {
    const sprite = ABILITY_SPRITES[id]!.sprites[0];
    const coverage = async (file: string) => {
      const pixels = await sharp(path.join('public', file)).ensureAlpha().raw().toBuffer();
      let alpha = 0;
      for (let i = 3; i < pixels.length; i += 4) alpha += pixels[i];
      return alpha;
    };
    expect(await coverage(sprite.hover!.file)).toBeGreaterThan(await coverage(sprite.idle.file) * 1.2);
  });

  it.each(['idle', 'hover'] as const)('reuses the exact same %s silhouettes with red/black and blue/cyan palettes', async (variant) => {
    const read = async (id: 'blackFlash' | 'divergentFist') => sharp(path.join('public', ABILITY_SPRITES[id]!.sprites[0][variant]!.file)).ensureAlpha().raw().toBuffer();
    const red = await read('blackFlash');
    const cyan = await read('divergentFist');
    let redPixels = 0, cyanPixels = 0, blackPixels = 0;
    for (let i = 0; i < red.length; i += 4) {
      expect(cyan[i + 3]).toBe(red[i + 3]);
      if (!red[i + 3]) continue;
      if (red[i] > 100 && red[i] > red[i + 1] * 1.5) redPixels++;
      if (Math.max(red[i], red[i + 1], red[i + 2]) < 65) blackPixels++;
      if (cyan[i + 1] > 100 && cyan[i + 2] > 100 && cyan[i] < cyan[i + 1] * 0.6) cyanPixels++;
    }
    expect(redPixels).toBeGreaterThan(100);
    expect(blackPixels).toBeGreaterThan(100);
    expect(cyanPixels).toBeGreaterThan(100);
  });
});
