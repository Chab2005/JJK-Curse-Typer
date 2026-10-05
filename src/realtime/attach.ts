// Branche le serveur de course sur le serveur HTTP de Next (server.ts) : les WebSocket de
// /ws/race/<code> arrivent ici, les autres (HMR de Next en dev) restent à Next.
import type { Server } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import { raceCodeFromPath } from '@/game/protocol';
import { RaceHub } from './raceHub';
import type { Connection } from './raceRoom';
import { raceFromLobby } from './seed';

/** Taille maximale d'un message reçu : un lot de frappes tient largement dedans. */
const MAX_PAYLOAD = 64 * 1024;

export function attachRaceServer(server: Server, hub = new RaceHub(raceFromLobby)) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD });

  server.on('upgrade', (req, socket, head) => {
    const code = raceCodeFromPath(req.url);
    if (code === null) return;
    const room = hub.open(code);
    if (!room) {
      socket.end('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n');
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
      const conn: Connection = { send: (data) => ws.readyState === ws.OPEN && ws.send(data) };
      room.connect(conn);
      ws.on('message', (data, isBinary) => {
        if (!isBinary) room.receive(conn, data.toString());
      });
      ws.on('close', () => room.disconnect(conn));
    });
  });

  return {
    hub,
    close() {
      hub.closeAll();
      for (const client of wss.clients) client.terminate();
      wss.close();
    },
  };
}
