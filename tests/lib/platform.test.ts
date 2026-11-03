import { describe, expect, it } from 'vitest';
import { detectOs, modifierKey } from '@/lib/platform';

const UA = {
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  macFirefox: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:132.0) Gecko/20100101 Firefox/132.0',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  linux: 'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
};

describe('detectOs', () => {
  it('reconnaît macOS, quel que soit le navigateur', () => {
    expect(detectOs(UA.macSafari)).toBe('mac');
    expect(detectOs(UA.macFirefox)).toBe('mac');
  });

  it('range iPadOS et iOS avec macOS (même touche Option sur un clavier Apple)', () => {
    expect(detectOs(UA.ipad)).toBe('mac');
  });

  it('reconnaît Windows et Linux', () => {
    expect(detectOs(UA.windows)).toBe('windows');
    expect(detectOs(UA.linux)).toBe('linux');
  });

  it('range Android et les agents inconnus dans « other »', () => {
    expect(detectOs(UA.android)).toBe('other');
    expect(detectOs('')).toBe('other');
  });
});

describe('modifierKey', () => {
  it('donne Option (⌥) sur Mac', () => {
    expect(modifierKey('mac')).toEqual({ symbol: '⌥', name: 'Option' });
  });

  it('donne Alt partout ailleurs', () => {
    for (const os of ['windows', 'linux', 'other'] as const) expect(modifierKey(os)).toEqual({ symbol: 'Alt', name: 'Alt' });
  });
});
