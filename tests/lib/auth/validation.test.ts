import { describe, expect, it } from 'vitest';
import { validateDisplayName, validatePassword, validateUsername } from '@/lib/auth/validation';

describe('validateUsername (AUTH-2)', () => {
  it('accepte 3 à 20 caractères parmi lettres, chiffres, _ et -', () => {
    expect(validateUsername('abc')).toBeNull();
    expect(validateUsername('Megumi_Shadows-9')).toBeNull();
    expect(validateUsername('a'.repeat(20))).toBeNull();
  });
  it('refuse trop court ou trop long', () => {
    expect(validateUsername('ab')).toBe('length');
    expect(validateUsername('a'.repeat(21))).toBe('length');
  });
  it('ignore les espaces autour', () => {
    expect(validateUsername('  ab  ')).toBe('length');
    expect(validateUsername('  abc  ')).toBeNull();
  });
  it('refuse les caractères spéciaux', () => {
    expect(validateUsername('bad name')).toBe('characters');
    expect(validateUsername('é-é-é')).toBe('characters');
  });
});

describe('validatePassword', () => {
  it('exige 8 à 128 caractères', () => {
    expect(validatePassword('1234567')).toBe('length');
    expect(validatePassword('12345678')).toBeNull();
    expect(validatePassword('x'.repeat(129))).toBe('length');
  });
});

describe('validateDisplayName', () => {
  it('accepte 1 à 32 caractères non vides', () => {
    expect(validateDisplayName('Gojo Satoru ✨')).toBeNull();
    expect(validateDisplayName('   ')).toBe('length');
    expect(validateDisplayName('x'.repeat(33))).toBe('length');
  });
});
