import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { ABILITY_SPRITES, shikigamiStyle } from '@/components/characters/abilitySprites';

describe('abilitySprites', () => {
  it('draws the shikigami, Gojo’s orbs and Nobara’s nails', () => {
    expect(Object.keys(ABILITY_SPRITES)).toEqual(expect.arrayContaining(['rabbitEscape', 'toad', 'maxElephant', 'nue', 'roundDeer', 'divineDogs', 'mahoraga', 'blue', 'red', 'purple', 'resonance', 'hairpin']));
  });

  it.each(['blue', 'red', 'purple'] as const)('gives %s a luminous plasma core and 32 frames of flowing energy', async (id) => {
    const { idle, hover } = ABILITY_SPRITES[id]!.sprites[0];
    expect(idle.frames).toBe(32);
    expect(hover!.frames).toBe(32);
    const { data, info } = await sharp(path.join('public', idle.file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let bright = 0;
    for (let y = 42; y <= 54; y++) for (let x = 42; x <= 54; x++) {
      const i = (y * info.width + x) * 4;
      if (Math.min(data[i], data[i + 1], data[i + 2]) > 180 && data[i + 3] === 255) bright++;
    }
    expect(bright).toBeGreaterThan(100);
  });

  it('starts Hollow Purple with separate Blue and Red orbs, then fuses them into a bright purple core', async () => {
    const { hover } = ABILITY_SPRITES.purple!.sprites[0];
    const { data, info } = await sharp(path.join('public', hover!.file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const pixel = (frame: number, x: number, y: number) => data.subarray((y * info.width + frame * hover!.w + x) * 4, (y * info.width + frame * hover!.w + x) * 4 + 4);
    expect(pixel(0, 48, 48)[3]).toBeLessThan(32);
    let blue = 0, red = 0;
    for (let y = 30; y < 66; y++) for (let x = 4; x < 92; x++) {
      const [r, g, b, a] = pixel(0, x, y);
      if (x < 48 && b > r * 1.5 && g > 90 && a > 100) blue++;
      if (x > 48 && r > b * 1.5 && a > 100) red++;
    }
    expect(blue).toBeGreaterThan(30);
    expect(red).toBeGreaterThan(30);
    let bright = 0;
    for (let y = 42; y <= 54; y++) for (let x = 42; x <= 54; x++) {
      const [r, g, b, a] = pixel(20, x, y);
      if (Math.min(r, g, b) > 180 && a === 255) bright++;
    }
    expect(bright).toBeGreaterThan(80);
    expect(hover!.frameMs).toBeGreaterThan(ABILITY_SPRITES.purple!.sprites[0].idle.frameMs);
  });

  it.each(['blue', 'red', 'purple', 'resonance', 'hairpin', 'divineFlames'] as const)('gives %s a transparent, animated idle and a distinct hover effect that fits its reserved space', async (id) => {
    const scene = ABILITY_SPRITES[id]!;
    expect(scene).toBeDefined();
    const sprite = scene.sprites[0];
    expect(sprite.hover).toBeDefined();
    expect(sprite.hover!.file).not.toBe(sprite.idle.file);
    for (const strip of [sprite.idle, sprite.hover!]) {
      const { data, info } = await sharp(path.join('public', strip.file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      expect(info.width).toBe(strip.w * strip.frames!);
      expect(info.height).toBe(strip.h);
      const frames = Array.from({ length: strip.frames! }, (_, frame) => {
        const pixels = [];
        for (let y = 0; y < info.height; y++) {
          const start = (y * info.width + frame * strip.w) * 4;
          pixels.push(data.subarray(start, start + strip.w * 4));
          // Transparent frame edges keep particles from being cut off between frames.
          expect(data[start + 3]).toBe(0);
          expect(data[start + (strip.w - 1) * 4 + 3]).toBe(0);
        }
        return Buffer.concat(pixels).toString('base64');
      });
      expect(new Set(frames).size).toBe(strip.frames);
      const style = shikigamiStyle(strip, sprite, scene.scale);
      expect(Number(style.width)).toBeLessThanOrEqual(scene.width);
      expect(Number(style.height)).toBeLessThanOrEqual(scene.height);
      expect(Math.abs(Number(style.bottom))).toBe(0);
    }
  });

  it('transforms Divine Flame once before its hover loop, joining the approved endpoint frames', async () => {
    const sprite = ABILITY_SPRITES.divineFlames!.sprites[0];
    expect(sprite.transition).toBeDefined();
    const transition = sprite.transition!;
    expect(transition.frames).toBe(8);
    expect(transition.frameMs! * transition.frames!).toBeLessThanOrEqual(500);
    const image = sharp(path.join('public', transition.file));
    const metadata = await image.metadata();
    expect([metadata.width, metadata.height, metadata.hasAlpha]).toEqual([96 * 8, 96, true]);
    const frame = (file: string, index: number) => sharp(path.join('public', file))
      .extract({ left: index * 96, top: 0, width: 96, height: 96 }).ensureAlpha().raw().toBuffer();
    expect(await frame(transition.file, 0)).toEqual(await frame(sprite.idle.file, 0));
    expect(await frame(transition.file, 7)).toEqual(await frame(sprite.hover!.file, 0));
    const frames = await Promise.all(Array.from({ length: 8 }, (_, index) => frame(transition.file, index)));
    expect(new Set(frames.map((pixels) => pixels.toString('base64'))).size).toBe(8);
  });

  it('gathers Divine Flame at rest and releases the fire arrow on hover', () => {
    const scene = ABILITY_SPRITES.divineFlames;
    expect(scene).toBeDefined();
    const sprite = scene!.sprites[0];
    expect(path.basename(sprite.idle.file)).toBe('divine-flame-idle.png');
    expect(path.basename(sprite.hover!.file)).toBe('divine-flame-hover.png');
    expect(sprite.hover!.frameMs).toBeLessThan(sprite.idle.frameMs);
    const idle = shikigamiStyle(sprite.idle, sprite, scene!.scale);
    const hover = shikigamiStyle(sprite.hover!, sprite, scene!.scale);
    for (const key of ['width', 'height', 'left', 'bottom'] as const) expect(hover[key]).toBe(idle[key]);
  });

  it('flies Nue in place and strikes with lightning on hover, lowered by the 31 px the lightning strip draws it higher', () => {
    const [sprite] = ABILITY_SPRITES.nue!.sprites;
    expect(path.basename(sprite.idle.file)).toBe('nue-flying.png');
    expect(path.basename(sprite.hover!.file)).toBe('nue-lightning.png');
    expect(sprite.hover!.foot! - sprite.idle.foot!).toBe(31);
  });

  it('keeps the text of Mahoraga in a column beside it', () => {
    expect(ABILITY_SPRITES.mahoraga!.beside).toBe(true);
    expect(path.basename(ABILITY_SPRITES.mahoraga!.sprites[0].hover!.file)).toBe('mahoraga-running.png');
  });

  it('sends two Divine Dogs, black and white, and a pack of rabbits', () => {
    expect(ABILITY_SPRITES.divineDogs!.sprites.map(({ idle }) => path.basename(idle.file))).toEqual(['divine-dog-black-idle.png', 'divine-dog-white-idle.png']);
    expect(ABILITY_SPRITES.rabbitEscape!.sprites.length).toBeGreaterThan(1);
  });

  it.each([0, 1])('plays a complete transparent run for Divine Dog %s on hover without resizing its scene', async (index) => {
    const scene = ABILITY_SPRITES.divineDogs!;
    const sprite = scene.sprites[index];
    expect(sprite.hover).toBeDefined();
    const running = sprite.hover!;
    expect(running.file).toBe(sprite.idle.file.replace('-idle.png', '-running.png'));
    const idleStyle = shikigamiStyle(sprite.idle, sprite, scene.scale);
    const runningStyle = shikigamiStyle(running, sprite, scene.scale);
    for (const key of ['height', 'bottom', 'transform'] as const) {
      expect(runningStyle[key]).toBe(idleStyle[key]);
    }
    // Facing left, the mirrored strip keeps the same right edge, as facing right kept the left one.
    expect(sprite.flip).toBe(true);
    expect(Number(runningStyle.left) + Number(runningStyle.width)).toBe(Number(idleStyle.left) + Number(idleStyle.width));
    expect(runningStyle.animation).toContain('640ms steps(8)');
    const { data, info } = await sharp(path.join('public', running.file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([running.w * 8, 160]);
    const frames = Array.from({ length: 8 }, (_, frame) => {
      const rows = [];
      let opaque = 0;
      for (let y = 0; y < 160; y++) {
        const start = (y * info.width + frame * running.w) * 4;
        const row = data.subarray(start, start + running.w * 4);
        rows.push(row);
        expect(row[3]).toBe(0);
        expect(row[(running.w - 1) * 4 + 3]).toBe(0);
        for (let x = 0; x < running.w; x++) {
          const alpha = row[x * 4 + 3];
          expect(alpha === 0 || alpha === 255).toBe(true);
          if (y === 0 || y >= 150) expect(alpha).toBe(0);
          if (alpha) opaque++;
        }
      }
      expect(opaque).toBeGreaterThan(1200);
      return Buffer.concat(rows).toString('base64');
    });
    expect(new Set(frames).size).toBe(8);
  });

  it('points every strip at a file in public/', () => {
    const files = Object.values(ABILITY_SPRITES).flatMap((scene) => scene!.sprites.flatMap(({ idle, hover }) => [idle, hover ?? idle]));
    for (const { file } of files) expect(existsSync(path.join('public', file)), file).toBe(true);
  });

  it('keeps the elephant and its running strip at their original aspect ratios', async () => {
    const scene = ABILITY_SPRITES.maxElephant!;
    expect(scene).toBeDefined();
    const sprite = scene.sprites[0];
    expect(path.basename(sprite.hover!.file)).toBe('max-elephant-running.png');
    for (const image of [sprite.idle, sprite.hover!]) {
      const metadata = await sharp(path.join('public', image.file)).metadata();
      const style = shikigamiStyle(image, sprite, scene.scale);
      expect(metadata.width).toBe(image.w * 8);
      expect(Number(style.width) / Number(style.height)).toBeCloseTo(image.w / metadata.height!, 2);
    }
    const idle = shikigamiStyle(sprite.idle, sprite, scene.scale);
    const running = shikigamiStyle(sprite.hover!, sprite, scene.scale);
    expect(Number(running.left) + Number(running.width)).toBe(Number(idle.left) + Number(idle.width));
  });
});
