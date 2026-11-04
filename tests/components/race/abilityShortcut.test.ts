import { describe, expect, it } from 'vitest';
import { shortcutAbility } from '@/components/race/abilityShortcut';

const event = (key: string, code: string, modifiers: Partial<{ altKey: boolean; ctrlKey: boolean; metaKey: boolean }> = {}) => ({ altKey: true, ctrlKey: false, metaKey: false, key, code, ...modifiers });

describe('shortcutAbility', () => {
  it('reconnaît Alt + Q, W et X', () => {
    expect(shortcutAbility(event('q', 'KeyQ'))).toBe('domain');
    expect(shortcutAbility(event('w', 'KeyW'))).toBe('technique');
    expect(shortcutAbility(event('x', 'KeyX'))).toBe('vow');
  });

  it('suit la lettre sur un clavier AZERTY', () => {
    expect(shortcutAbility(event('w', 'KeyZ'))).toBe('technique');
    expect(shortcutAbility(event('q', 'KeyA'))).toBe('domain');
  });

  it('se rabat sur la touche physique quand Option change la lettre (Mac)', () => {
    expect(shortcutAbility(event('∑', 'KeyW'))).toBe('technique');
    expect(shortcutAbility(event('≈', 'KeyX'))).toBe('vow');
  });

  it('ignore le reste', () => {
    expect(shortcutAbility(event('w', 'KeyW', { altKey: false }))).toBeNull();
    expect(shortcutAbility(event('w', 'KeyW', { metaKey: true }))).toBeNull();
    expect(shortcutAbility(event('w', 'KeyW', { ctrlKey: true }))).toBeNull();
    expect(shortcutAbility(event('e', 'KeyE'))).toBeNull();
  });
});
