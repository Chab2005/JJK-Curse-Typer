import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CODE_MAX_FAILURES } from '@/lib/codeAttempts';
import { clearCodeAttempts } from '@/lib/codeGuard';
import { clearLobbies, createLobby } from '@/lib/lobbies';

const state = { viewerId: '' };

vi.mock('server-only', () => ({}));
vi.mock('@/lib/currentUser', () => ({ getViewerId: async () => state.viewerId }));
vi.mock('@/lib/lobbyPresence', () => ({ connectViewer: () => () => {} }));

const { GET } = await import('@/app/api/lobbies/[code]/events/route');

const call = async (code: string, ip = '10.0.0.5') => {
  const controller = new AbortController();
  const response = await GET(new NextRequest(`http://localhost/api/lobbies/${code}/events`, { headers: { 'x-real-ip': ip }, signal: controller.signal }), {
    params: Promise.resolve({ code }),
  });
  controller.abort();
  return response;
};

beforeEach(() => {
  clearLobbies();
  clearCodeAttempts();
  state.viewerId = 'yuji';
});

describe('GET /api/lobbies/<code>/events (SALLE-10)', () => {
  it('répond 404 hors du salon, puis 429 avec Retry-After une fois l’IP bloquée', async () => {
    for (let i = 0; i < CODE_MAX_FAILURES; i++) expect((await call('ZZZ-ZZZ')).status).toBe(404);
    const blocked = await call('ZZZ-ZZZ');
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('Retry-After'))).toBeGreaterThan(0);
  });

  it('ouvre le flux à qui est dans le salon, même depuis une IP bloquée', async () => {
    const { code } = createLobby((h) => h, { id: 'yuji', name: 'yuji', avatar: null });
    for (let i = 0; i < CODE_MAX_FAILURES; i++) await call('ZZZ-ZZZ');
    const response = await call(code);
    expect(response.status).toBe(200);
    await response.body?.cancel();
  });

  it('compte aussi un code mal formé', async () => {
    for (let i = 0; i < CODE_MAX_FAILURES; i++) await call('%E0%A4%A');
    expect((await call('ZZZ-ZZZ')).status).toBe(429);
  });
});
