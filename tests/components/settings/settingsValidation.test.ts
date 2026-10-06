import { describe, expect, it } from 'vitest';
import { validateSettings } from '@/components/settings/settingsValidation';
import { AVATAR_MAX_BYTES } from '@/lib/auth/avatar';

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const valid = { displayName: 'Gojo', github: '', discord: '', avatar: null };

describe('validateSettings', () => {
  it('accepte des paramètres valides, sans nouvelle photo', () => {
    expect(validateSettings(valid)).toEqual({});
  });

  it('accepte une nouvelle photo JPEG, PNG ou WebP', () => {
    expect(validateSettings({ ...valid, avatar: png })).toEqual({});
  });

  it('rapporte chaque champ invalide en même temps', () => {
    expect(validateSettings({ displayName: '  ', github: 'not a user!', discord: 'Not Valid!', avatar: Uint8Array.from([1, 2, 3, 4]) })).toEqual({
      displayName: 'displayName',
      github: 'github',
      discord: 'discord',
      avatar: 'avatarType',
    });
  });

  it('refuse une photo de plus de 2 Mo', () => {
    expect(validateSettings({ ...valid, avatar: new Uint8Array(AVATAR_MAX_BYTES + 1) }).avatar).toBe('avatarSize');
  });
});
