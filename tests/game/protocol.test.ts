import { describe, expect, it } from 'vitest';
import { parseClientMessage, raceCodeFromPath, raceSocketPath } from '@/game/protocol';

describe('parseClientMessage', () => {
  it('lit les messages valides', () => {
    expect(parseClientMessage('{"type":"join","guest":"guest-12345678"}')).toEqual({ type: 'join', guest: 'guest-12345678' });
    expect(parseClientMessage('{"type":"join","guest":"guest-12345678","ticket":"abc.def"}')).toEqual({ type: 'join', guest: 'guest-12345678', ticket: 'abc.def' });
    expect(parseClientMessage('{"type":"keys","strokes":[{"key":"a","t":12}]}')).toEqual({ type: 'keys', strokes: [{ key: 'a', t: 12 }] });
    expect(parseClientMessage('{"type":"abandon"}')).toEqual({ type: 'abandon' });
  });

  it('rejette le JSON invalide et les messages mal formés', () => {
    expect(parseClientMessage('nope')).toBeNull();
    expect(parseClientMessage('{"type":"start"}')).toBeNull();
    expect(parseClientMessage('{"type":"join","guest":""}')).toBeNull();
    expect(parseClientMessage('{"type":"keys","strokes":[{"key":"a","t":-1}]}')).toBeNull();
    expect(parseClientMessage(JSON.stringify({ type: 'keys', strokes: Array.from({ length: 500 }, (_, t) => ({ key: 'a', t })) }))).toBeNull();
  });
});

describe('chemin du WebSocket de course', () => {
  it('fait l’aller-retour entre code et chemin', () => {
    expect(raceSocketPath('TKY-HGH')).toBe('/ws/race/TKY-HGH');
    expect(raceCodeFromPath('/ws/race/TKY-HGH')).toBe('TKY-HGH');
    expect(raceCodeFromPath('/ws/race/tky-hgh?x=1')).toBe('TKY-HGH');
  });

  it('ignore les autres chemins (HMR de Next, etc.)', () => {
    expect(raceCodeFromPath('/_next/hmr')).toBeNull();
    expect(raceCodeFromPath('/ws/race/')).toBeNull();
    expect(raceCodeFromPath('/ws/race/a%20b')).toBeNull();
    expect(raceCodeFromPath(undefined)).toBeNull();
  });
});
