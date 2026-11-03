import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { ABILITY_SPRITES, shikigamiStyle } from '@/components/characters/abilitySprites';

describe('Yuta’s pixel effects', () => {
  it.each([
    ['jacobsLadder', 64, 128],
    ['cursedSpeech', 32, 32],
    ['skyManipulation', 32, 32],
  ] as const)('plays %s at its logical resolution without clipping or resizing on hover', async (id, width, height) => {
    const scene = ABILITY_SPRITES[id];
    expect(scene).toBeDefined();
    const sprite = scene!.sprites[0];
    const idle = shikigamiStyle(sprite.idle, sprite, scene!.scale);
    const hover = shikigamiStyle(sprite.hover!, sprite, scene!.scale);
    for (const key of ['width', 'height', 'left', 'bottom'] as const) expect(hover[key]).toBe(idle[key]);
    expect(Number(idle.width)).toBeLessThanOrEqual(scene!.width);
    expect(Number(idle.height)).toBeLessThanOrEqual(scene!.height);
    expect(sprite.hover!.frameMs).toBeLessThan(sprite.idle.frameMs);
    expect([sprite.idle.w, sprite.idle.h]).toEqual([width, height]);

    const { data, info } = await sharp(path.join('public', sprite.idle.file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([width * 16, height]);
    const frames = Array.from({ length: 16 }, (_, frame) => {
      const rows = [];
      let visible = 0;
      for (let y = 0; y < height; y++) {
        const start = (y * info.width + frame * width) * 4;
        const row = data.subarray(start, start + width * 4);
        rows.push(row);
        for (let x = 0; x < width; x++) {
          const alpha = row[x * 4 + 3];
          if (x === 0 || x === width - 1 || y === 0 || y === height - 1) expect(alpha).toBe(0);
          if (alpha) visible++;
        }
      }
      expect(visible).toBeGreaterThan(10);
      return Buffer.concat(rows).toString('base64');
    });
    expect(new Set(frames).size).toBe(16);
  });

  it('adds finer pillar detail while preserving every approved impact frame and its displayed size', async () => {
    const scene = ABILITY_SPRITES.jacobsLadder!;
    const sprite = scene.sprites[0];
    const style = shikigamiStyle(sprite.idle, sprite, scene.scale);
    expect([style.width, style.height]).toEqual([64, 128]);
    const reference = 'scripts/assets/yuta/jacobs-ladder-approved-impact-strip.png';
    let detailedPixels = 0;
    for (let frame = 0; frame < 16; frame++) {
      const approved = await sharp(reference).extract({ left: frame * 32, top: 0, width: 32, height: 64 })
        .resize(64, 128, { kernel: 'nearest' }).ensureAlpha().raw().toBuffer();
      const current = await sharp(path.join('public', sprite.idle.file))
        .extract({ left: frame * 64, top: 0, width: 64, height: 128 }).ensureAlpha().raw().toBuffer();
      // The lower third, including the tallest curling impact lobes, is the approved art verbatim.
      expect(current.subarray(84 * 64 * 4)).toEqual(approved.subarray(84 * 64 * 4));
      for (let y = 8; y < 76; y += 2) for (let x = 8; x < 56; x += 2) {
        const offset = (y * 64 + x) * 4;
        if (current[offset + 3] > 128 && current[offset + 7] > 128 && !current.subarray(offset, offset + 3).equals(current.subarray(offset + 4, offset + 7))) detailedPixels++;
      }
    }
    expect(detailedPixels).toBeGreaterThan(50);
  });

  it('keeps Cursed Speech’s echo strokes visible instead of dropping pixels into transparency', async () => {
    const { idle } = ABILITY_SPRITES.cursedSpeech!.sprites[0];
    const { data, info } = await sharp(path.join('public', idle.file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let frame = 0; frame < 16; frame++) {
      let solid = 0;
      const quadrants = [0, 0, 0, 0];
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
        const alpha = data[(y * info.width + frame * 32 + x) * 4 + 3];
        expect(alpha === 0 || alpha === 255).toBe(true);
        if (alpha === 255) {
          solid++;
          quadrants[Number(y >= 16) * 2 + Number(x >= 16)]++;
        }
      }
      expect(solid).toBeGreaterThan(30);
      quadrants.forEach((count) => expect(count).toBeGreaterThan(5));
    }
  });
});
