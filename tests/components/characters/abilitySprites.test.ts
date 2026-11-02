import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ABILITY_SPRITES } from '@/components/characters/abilitySprites';

describe('abilitySprites', () => {
  it('draws the shikigami that have pixel art, the others not yet', () => {
    expect(Object.keys(ABILITY_SPRITES)).toEqual(['rabbitEscape', 'toad', 'roundDeer', 'divineDogs']);
  });

  it('sends two Divine Dogs, black and white, and a pack of rabbits', () => {
    expect(ABILITY_SPRITES.divineDogs!.sprites.map(({ idle }) => path.basename(idle.file))).toEqual(['divine-dog-black-idle.png', 'divine-dog-white-idle.png']);
    expect(ABILITY_SPRITES.rabbitEscape!.sprites.length).toBeGreaterThan(1);
  });

  it('points every strip at a file in public/', () => {
    const files = Object.values(ABILITY_SPRITES).flatMap((scene) => scene!.sprites.flatMap(({ idle, hover }) => [idle, hover ?? idle]));
    for (const { file } of files) expect(existsSync(path.join('public', file)), file).toBe(true);
  });
});
