import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { ABILITY_SPRITES, shikigamiStyle } from '@/components/characters/abilitySprites';

describe('abilitySprites', () => {
  it('draws the shikigami that have pixel art, the others not yet', () => {
    expect(Object.keys(ABILITY_SPRITES)).toEqual(['rabbitEscape', 'toad', 'maxElephant', 'nue', 'roundDeer', 'divineDogs', 'mahoraga']);
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
