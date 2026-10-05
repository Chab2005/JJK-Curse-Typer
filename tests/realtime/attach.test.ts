import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import type { ServerMessage } from '@/game/protocol';
import { attachRaceServer } from '@/realtime/attach';

// Test de bout en bout : un vrai serveur HTTP, un vrai client WebSocket.

let server: Server;
let close: () => void;
let base: string;

beforeEach(async () => {
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
});
