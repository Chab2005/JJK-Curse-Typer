import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import type { ServerMessage } from '@/game/protocol';
import { authSecret } from '@/lib/auth/secret';
import { CODE_MAX_FAILURES } from '@/lib/codeAttempts';
import { clearCodeAttempts } from '@/lib/codeGuard';
import { attachRaceServer } from '@/realtime/attach';
import { seatTicket } from '@/realtime/ticket';

// Test de bout en bout : un vrai serveur HTTP, un vrai client WebSocket.

let server: Server;
let close: () => void;
let base: string;

beforeEach(async () => {
  clearCodeAttempts();
  server = createServer((_req, res) => res.end('next'));
  close = attachRaceServer(server).close;
  await new Promise<void>((resolve) => server.listen(0, resolve));
  base = `ws://localhost:${(server.address() as AddressInfo).port}`;
});

afterEach(async () => {
  close();
  await new Promise((resolve) => server.close(resolve));
});

function firstMessage(socket: WebSocket): Promise<ServerMessage> {
  return new Promise((resolve, reject) => {
    socket.once('message', (data) => resolve(JSON.parse(data.toString())));
    socket.once('error', reject);
  });
}

describe('attachRaceServer', () => {
  it('accueille un joueur dans la course du lobby', async () => {
    const socket = new WebSocket(`${base}/ws/race/TKY-HGH`);
    await new Promise((resolve) => socket.once('open', resolve));
    const welcome = firstMessage(socket);
    socket.send(JSON.stringify({ type: 'join', guest: 'guest-aaaaaaaa' }));
    expect(await welcome).toMatchObject({ type: 'welcome', you: 'Megumi_Shadows', race: { phase: 'countdown' } });
    socket.close();
  });

  it('refuse un lobby inconnu', async () => {
    const socket = new WebSocket(`${base}/ws/race/ZZZ-ZZZ`);
    const status = await new Promise<number>((resolve) => socket.once('unexpected-response', (_req, res) => resolve(res.statusCode ?? 0)));
    expect(status).toBe(404);
  });

  it('laisse les autres requêtes d’upgrade à Next (HMR)', async () => {
    let seenByOthers = false;
    server.on('upgrade', (req, socket) => {
      if (req.url === '/_next/hmr') {
        seenByOthers = true;
        socket.destroy();
      }
    });
    const socket = new WebSocket(`${base}/_next/hmr`);
    await new Promise((resolve) => socket.once('error', resolve));
    expect(seenByOthers).toBe(true);
  });

  it('cache les WebSocket de course à Next, qui fermerait celles dont l’URL correspond à une page', async () => {
    // Comme Next quand la 404 attrape-tout [locale]/[...rest] correspond à /ws/race/<code>.
    let seenByOthers = false;
    server.on('upgrade', (_req, socket) => {
      seenByOthers = true;
      socket.end();
    });
    const socket = new WebSocket(`${base}/ws/race/TKY-HGH`);
    await new Promise((resolve) => socket.once('open', resolve));
    const welcome = firstMessage(socket);
    socket.send(JSON.stringify({ type: 'join', guest: 'guest-aaaaaaaa' }));
    expect(await welcome).toMatchObject({ type: 'welcome' });
    expect(seenByOthers).toBe(false);
    socket.close();
  });
});

/** Statut HTTP d'un upgrade refusé, ou 101 s'il est accepté. */
function upgradeStatus(path: string, ip: string): Promise<number> {
  const socket = new WebSocket(`${base}${path}`, { headers: { 'x-real-ip': ip } });
  return new Promise<number>((resolve) => {
    socket.once('open', () => {
      socket.close();
      resolve(101);
    });
    socket.once('unexpected-response', (_req, res) => resolve(res.statusCode ?? 0));
  });
}

describe('force brute sur les codes (SALLE-10)', () => {
  const guess = async (ip: string, times: number) => {
    for (let i = 0; i < times; i++) expect(await upgradeStatus('/ws/race/ZZZ-ZZZ', ip)).toBe(404);
  };

  it('répond 429 après 10 codes inconnus par minute, même pour un code valide', async () => {
    await guess('10.0.0.1', CODE_MAX_FAILURES);
    expect(await upgradeStatus('/ws/race/ZZZ-ZZZ', '10.0.0.1')).toBe(429);
    expect(await upgradeStatus('/ws/race/TKY-HGH', '10.0.0.1')).toBe(429);
  });

  it('ne bloque pas une autre IP', async () => {
    await guess('10.0.0.1', CODE_MAX_FAILURES);
    expect(await upgradeStatus('/ws/race/TKY-HGH', '10.0.0.2')).toBe(101);
  });

  it('laisse entrer un joueur muni du ticket de ce salon', async () => {
    await guess('10.0.0.1', CODE_MAX_FAILURES);
    const ticket = encodeURIComponent(seatTicket('TKY-HGH', 'Megumi_Shadows', authSecret()));
    expect(await upgradeStatus(`/ws/race/TKY-HGH?ticket=${ticket}`, '10.0.0.1')).toBe(101);
  });

  it('une course trouvée ne compte pas comme un échec', async () => {
    for (let i = 0; i < CODE_MAX_FAILURES + 2; i++) expect(await upgradeStatus('/ws/race/TKY-HGH', '10.0.0.3')).toBe(101);
  });
});
