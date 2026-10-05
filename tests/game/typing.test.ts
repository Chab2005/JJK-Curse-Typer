import { describe, expect, it } from 'vitest';
import { BACKSPACE, correctChars, isValidKey, startTyping, typeKey, typeKeys, type Keystroke } from '@/game/typing';

const strokes = (keys: string, from = 100, step = 100): Keystroke[] => [...keys].map((key, i) => ({ key, t: from + i * step }));

describe('typeKey en mode accumulation (RACE-7)', () => {
  it('avance sur un bon caractère et compte la série', () => {
    const state = typeKeys(startTyping('abc', 'accumulate'), strokes('ab'));
    expect(state).toMatchObject({ input: 'ab', keystrokes: 2, errors: 0, streak: 2, peak: 2, lastT: 200, finishedAt: null });
  });

  it('garde la faute dans la saisie, compte l’erreur et remet la série à zéro', () => {
    const state = typeKeys(startTyping('abc', 'accumulate'), strokes('ax'));
    expect(state).toMatchObject({ input: 'ax', keystrokes: 2, errors: 1, streak: 0 });
    expect(correctChars(state)).toBe(1);
  });

  it('efface le dernier caractère avec Retour arrière, sans effacer l’erreur comptée', () => {
    const state = typeKeys(startTyping('abc', 'accumulate'), [...strokes('ax'), { key: BACKSPACE, t: 300 }, { key: 'b', t: 400 }]);
    expect(state).toMatchObject({ input: 'ab', errors: 1, keystrokes: 3 });
  });

  it('termine au dernier caractère, même faux, à l’heure de la frappe', () => {
    const state = typeKeys(startTyping('ab', 'accumulate'), strokes('ax'));
    expect(state.finishedAt).toBe(200);
  });

  it('ignore les frappes après la fin', () => {
    const done = typeKeys(startTyping('ab', 'accumulate'), strokes('ab'));
    expect(typeKey(done, { key: 'c', t: 900 })).toBe(done);
  });

  it('ne recule pas plus loin que le début', () => {
    const state = typeKey(startTyping('ab', 'accumulate'), { key: BACKSPACE, t: 50 });
    expect(state.input).toBe('');
  });
});

describe('typeKey en mode blocage (RACE-7)', () => {
  it('bloque sur une faute jusqu’au bon caractère, en comptant l’erreur', () => {
    const state = typeKeys(startTyping('abc', 'block'), strokes('axxb'));
    expect(state).toMatchObject({ input: 'ab', errors: 2, keystrokes: 4, streak: 1 });
  });

  it('ignore Retour arrière : la saisie est toujours juste', () => {
    const state = typeKeys(startTyping('abc', 'block'), [...strokes('ab'), { key: BACKSPACE, t: 300 }]);
    expect(state.input).toBe('ab');
  });
});

describe('peak', () => {
  it('ne remonte pas quand on efface puis retape le même caractère', () => {
    const state = typeKeys(startTyping('abc', 'accumulate'), [...strokes('ab'), { key: BACKSPACE, t: 300 }, { key: 'b', t: 400 }]);
    expect(state.peak).toBe(2);
  });
});

describe('isValidKey', () => {
  it('accepte un seul caractère imprimable ou Retour arrière', () => {
    expect(isValidKey('a')).toBe(true);
    expect(isValidKey('é')).toBe(true);
    expect(isValidKey(' ')).toBe(true);
    expect(isValidKey(BACKSPACE)).toBe(true);
  });

  it('refuse les touches spéciales, les caractères de contrôle et les chaînes', () => {
    expect(isValidKey('Shift')).toBe(false);
    expect(isValidKey('ab')).toBe(false);
    expect(isValidKey('\n')).toBe(false);
    expect(isValidKey('')).toBe(false);
  });
});
