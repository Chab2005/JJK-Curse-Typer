import { describe, expect, it } from 'vitest';
import { AVATAR_MAX_BYTES, avatarUrl, detectImageType, validateAvatarFile } from '@/lib/auth/avatar';

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const webp = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50]);

describe('avatar', () => {
  it('reconnaît JPEG, PNG et WebP par leurs premiers octets, pas par le nom', () => {
    expect(detectImageType(png)).toBe('png');
    expect(detectImageType(jpeg)).toBe('jpeg');
    expect(detectImageType(webp)).toBe('webp');
    expect(detectImageType(Uint8Array.from([0x47, 0x49, 0x46, 0x38]))).toBeNull(); // GIF
  });
  it('refuse plus de 2 Mo, un fichier vide ou d’un autre type', () => {
    expect(AVATAR_MAX_BYTES).toBe(2 * 1024 * 1024);
    expect(validateAvatarFile(new Uint8Array(AVATAR_MAX_BYTES + 1))).toBe('size');
    expect(validateAvatarFile(new Uint8Array(0))).toBe('size');
    expect(validateAvatarFile(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]))).toBe('type');
    expect(validateAvatarFile(png)).toBeNull();
  });

  it('construit l’URL versionnée de la photo, pseudo encodé', () => {
    expect(avatarUrl('Megumi Shadows', 3)).toBe('/api/avatar/Megumi%20Shadows?v=3');
  });
});
