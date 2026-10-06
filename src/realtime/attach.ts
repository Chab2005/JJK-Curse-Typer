// Branche le serveur de course sur le serveur HTTP de Next (server.ts) : les WebSocket de
// /ws/race/<code> arrivent ici, les autres (HMR de Next en dev) restent à Next.
import type { IncomingMessage, Server } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocketServer, type WebSocket } from 'ws';
import { raceCodeFromPath } from '@/game/protocol';
import { RaceHub } from './raceHub';
import type { Connection } from './raceRoom';
import { raceFromLobby } from './seed';

/** Taille maximale d'un message reçu : un lot de frappes tient largement dedans. */
const MAX_PAYLOAD = 64 * 1024;

export function attachRaceServer(server: Server, hub = new RaceHub(raceFromLobby)) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD });

  const upgrade = (req: IncomingMessage, socket: Duplex, head: Buffer, code: string) => {
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
  };

  // Next ajoute son propre écouteur d'upgrade à la première requête, et il ferme toute connexion dont
  // l'URL correspond à une page : la 404 attrape-tout [locale]/[...rest] correspond aussi à /ws/race/<code>.
  // Les upgrades de course ne sont donc remis qu'ici ; les autres (HMR) suivent le chemin habituel.
  const emit = server.emit;
  const passOn = emit as (this: Server, event: string | symbol, ...args: unknown[]) => boolean;
  server.emit = function (this: Server, event: string | symbol, ...args: unknown[]) {
    if (event === 'upgrade') {
      const [req, socket, head] = args as [IncomingMessage, Duplex, Buffer];
      const code = raceCodeFromPath(req.url);
      if (code !== null) {
        upgrade(req, socket, head, code);
        return true;
      }
    }
    return passOn.call(this, event, ...args);
  } as Server['emit'];
  // Sans écouteur d'upgrade, Node traite la demande comme une requête ordinaire, sans passer par emit.
  const keepUpgrades = () => {};
  server.on('upgrade', keepUpgrades);

  return {
    hub,
    close() {
      server.emit = emit;
      server.off('upgrade', keepUpgrades);
      hub.closeAll();
      for (const client of wss.clients) client.terminate();
      wss.close();
    },
  };
}
