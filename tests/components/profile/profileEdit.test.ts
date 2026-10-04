import { describe, expect, it } from 'vitest';
import { discordHref, githubHandle, normalizeGithub, validateLinks, validateProfileEdit } from '@/components/profile/profileEdit';

const valid = { username: 'Megumi_Shadows', github: '', discord: '' };

describe('validateProfileEdit', () => {
  it('accepte un profil valide', () => {
    expect(validateProfileEdit(valid)).toEqual({});
  });

  it('exige un nom de 3 à 20 caractères', () => {
    expect(validateProfileEdit({ ...valid, username: 'ab' }).username).toBe('length');
    expect(validateProfileEdit({ ...valid, username: 'a'.repeat(21) }).username).toBe('length');
  });

  it('n’accepte dans le nom que lettres, chiffres, _ et -', () => {
    expect(validateProfileEdit({ ...valid, username: 'Megumi Shadows' }).username).toBe('characters');
    expect(validateProfileEdit({ ...valid, username: 'Yuji-Itadori_2' }).username).toBeUndefined();
  });

  it('refuse un lien GitHub qui ne mène pas à un profil', () => {
    expect(validateProfileEdit({ ...valid, github: 'https://gitlab.com/megumi' }).github).toBe('invalid');
    expect(validateProfileEdit({ ...valid, github: 'github.com/megumi' }).github).toBeUndefined();
  });

  it('accepte un nom Discord ou un lien Discord', () => {
    expect(validateProfileEdit({ ...valid, discord: 'megumi.shadows' }).discord).toBeUndefined();
    expect(validateProfileEdit({ ...valid, discord: 'https://discord.com/users/123456789' }).discord).toBeUndefined();
  });

  it('refuse un nom Discord trop court, trop long ou avec des caractères interdits', () => {
    for (const discord of ['m', 'a'.repeat(33), 'megumi shadows', 'https://evil.example/discord']) {
      expect(validateProfileEdit({ ...valid, discord }).discord, discord).toBe('invalid');
    }
  });
});

describe('normalizeGithub et githubHandle', () => {
  it('complète un lien GitHub sans protocole', () => {
    expect(normalizeGithub(' github.com/megumi ')).toBe('https://github.com/megumi');
  });

  it('renvoie une chaîne vide si rien n’est saisi', () => {
    expect(normalizeGithub('  ')).toBe('');
  });

  it('extrait le pseudo GitHub du lien', () => {
    expect(githubHandle('https://github.com/megumi/')).toBe('megumi');
  });
});

describe('discordHref', () => {
  it('garde un lien Discord tel quel', () => {
    expect(discordHref('https://discord.com/users/123')).toBe('https://discord.com/users/123');
  });

  it('ne fait pas de lien pour un simple nom', () => {
    expect(discordHref('megumi.shadows')).toBeNull();
  });
});

describe('validateLinks', () => {
  it('accepts empty links, a GitHub profile and a Discord name', () => {
    expect(validateLinks({ github: '', discord: '' })).toEqual({});
    expect(validateLinks({ github: 'github.com/megumi', discord: 'megumi.shadows' })).toEqual({});
  });

  it('flags a bad GitHub link and a bad Discord name', () => {
    expect(validateLinks({ github: 'https://gitlab.com/x', discord: 'No Spaces' })).toEqual({ github: 'invalid', discord: 'invalid' });
  });
});
