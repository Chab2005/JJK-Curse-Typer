import { describe, expect, it } from 'vitest';
import {
  credentialsSchema,
  guestNameSchema,
  inviteCountSchema,
  inviteTokenSchema,
  joinOptionsSchema,
  lobbyCodeSchema,
  parseForm,
  providerSchema,
  settingsFormSchema,
  usernameParamSchema,
} from '@/lib/schemas';

const form = (entries: Record<string, string | File>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
};

describe('credentialsSchema (register, login, OAuth) — TECH-07', () => {
  it('trims the username and keeps the password as typed', () => {
    expect(parseForm(credentialsSchema, form({ username: '  Gojo_Satoru ', password: ' secret pass ' }))).toEqual({ username: 'Gojo_Satoru', password: ' secret pass ' });
  });

  it('rejects missing, non-text or oversized fields', () => {
    expect(parseForm(credentialsSchema, form({ username: 'Gojo' }))).toBeNull();
    expect(parseForm(credentialsSchema, form({ username: new File(['x'], 'a.txt'), password: 'secret pass' }))).toBeNull();
    expect(parseForm(credentialsSchema, form({ username: 'a'.repeat(65), password: 'secret pass' }))).toBeNull();
    expect(parseForm(credentialsSchema, form({ username: 'Gojo', password: 'p'.repeat(1025) }))).toBeNull();
  });
});

describe('guestNameSchema', () => {
  it('accepts a string, trimmed, and refuses anything else', () => {
    expect(guestNameSchema.safeParse('  Yuji ').data).toBe('Yuji');
    expect(guestNameSchema.safeParse(42).success).toBe(false);
    expect(guestNameSchema.safeParse(undefined).success).toBe(false);
    expect(guestNameSchema.safeParse('y'.repeat(65)).success).toBe(false);
  });
});

describe('settingsFormSchema', () => {
  it('reads the three text fields, empty when absent', () => {
    expect(parseForm(settingsFormSchema, form({ displayName: ' Nobara ', github: 'octo', discord: '' }))).toEqual({ displayName: 'Nobara', github: 'octo', discord: '' });
    expect(parseForm(settingsFormSchema, form({}))).toEqual({ displayName: '', github: '', discord: '' });
    expect(parseForm(settingsFormSchema, form({ displayName: 'x'.repeat(300) }))).toBeNull();
  });
});

describe('lobbyCodeSchema (join action, SSE route)', () => {
  it('accepts a ABC-123 code in any case and upper-cases it', () => {
    expect(lobbyCodeSchema.safeParse('shj-60s').data).toBe('SHJ-60S');
    expect(lobbyCodeSchema.safeParse(' ABC-234 ').data).toBe('ABC-234');
  });

  it('rejects anything else', () => {
    for (const bad of ['', 'ABCDEF', 'AB-1234', '../etc', 'ABC-23!', 123, null, undefined, 'ABC-234 x']) expect(lobbyCodeSchema.safeParse(bad).success, String(bad)).toBe(false);
  });
});

describe('joinOptionsSchema', () => {
  it('defaults to no options and accepts spectate and an invite token', () => {
    expect(joinOptionsSchema.parse(undefined)).toEqual({});
    expect(joinOptionsSchema.parse({ spectate: true, invite: 'a'.repeat(22) })).toEqual({ spectate: true, invite: 'a'.repeat(22) });
  });

  it('refuses unknown keys and malformed values', () => {
    expect(joinOptionsSchema.parse({ leaveOther: true })).toEqual({ leaveOther: true });
    expect(joinOptionsSchema.safeParse({ leaveOther: 'yes' }).success).toBe(false);
    expect(joinOptionsSchema.safeParse({ admin: true }).success).toBe(false);
    expect(joinOptionsSchema.safeParse({ spectate: 'yes' }).success).toBe(false);
    expect(joinOptionsSchema.safeParse({ invite: 'x'.repeat(129) }).success).toBe(false);
    // A malformed token from the URL is not an error: it is ignored later (inviteToClaim).
    expect(joinOptionsSchema.safeParse({ invite: 'short' }).success).toBe(true);
  });
});

describe('invite actions', () => {
  it('bounds the number of links to create between 1 and 30', () => {
    expect(inviteCountSchema.safeParse(1).success).toBe(true);
    expect(inviteCountSchema.safeParse(30).success).toBe(true);
    for (const bad of [0, 31, 2.5, -1, '3', NaN, Infinity]) expect(inviteCountSchema.safeParse(bad).success, String(bad)).toBe(false);
  });

  it('only accepts a 22-character base64url token', () => {
    expect(inviteTokenSchema.safeParse('abcdefghijklmnopqrstuv').success).toBe(true);
    expect(inviteTokenSchema.safeParse('abcdefghijklmnopqrstu').success).toBe(false);
    expect(inviteTokenSchema.safeParse('abcdefghijklmnopqrstu!').success).toBe(false);
  });
});

describe('route parameters', () => {
  it('accepts the two OAuth providers only', () => {
    expect(providerSchema.safeParse('discord').success).toBe(true);
    expect(providerSchema.safeParse('github').success).toBe(true);
    expect(providerSchema.safeParse('google').success).toBe(false);
  });

  it('decodes and validates the avatar username', () => {
    expect(usernameParamSchema.safeParse('Megumi_Shadows').data).toBe('Megumi_Shadows');
    expect(usernameParamSchema.safeParse('Meg%75mi').data).toBe('Megumi');
    for (const bad of ['ab', 'a'.repeat(21), 'bad name', '%E0%A4%A', '../x']) expect(usernameParamSchema.safeParse(bad).success, bad).toBe(false);
  });
});
