// Branche le serveur de course sur le serveur HTTP de Next (server.ts) : les WebSocket de
// /ws/race/<code> arrivent ici, les autres (HMR de Next en dev) restent à Next.
import type { IncomingMessage, Server } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocketServer, type WebSocket } from 'ws';
import { clientIp } from '@/components/lobby/lobbyAccess';
import { raceCodeFromPath } from '@/game/protocol';
import { authSecret } from '@/lib/auth/secret';
import { checkCode, codeRetryAfterSeconds } from '@/lib/codeGuard';
import { RaceHub } from './raceHub';
import type { Connection } from './raceRoom';
import { raceFromLobby } from './seed';
import { readSeatTicket } from './ticket';

/** Taille maximale d'un message reçu : un lot de frappes tient largement dedans. */
const MAX_PAYLOAD = 64 * 1024;

/** IP du client d'un upgrade : en-têtes du proxy (comme les pages), sinon l'adresse de la socket. */
export function upgradeIp(req: IncomingMessage): string | null {
  const header = (name: string) => {
    const value = req.headers[name];
    return (Array.isArray(value) ? value[0] : value) ?? null;
  };
  return clientIp({ get: header }) ?? req.socket.remoteAddress ?? null;
}

/** Ticket de siège passé dans l'URL (`?ticket=`) : il prouve que le joueur est dans le salon. */
function urlTicket(req: IncomingMessage): string | undefined {
  try {
    return new URL(req.url ?? '', 'http://race.local').searchParams.get('ticket') ?? undefined;
  } catch {
    return undefined;
  }
}

export function attachRaceServer(server: Server, hub = new RaceHub(raceFromLobby)) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD });

  const refuse = (socket: Duplex, status: string, extra = '') => socket.end(`HTTP/1.1 ${status}\r\n${extra}Connection: close\r\n\r\n`);

  const upgrade = (req: IncomingMessage, socket: Duplex, head: Buffer, code: string) => {
    // Force brute sur les codes (SALLE-10) : un joueur muni du ticket de ce salon n'est jamais bloqué ni compté.
    const ip = upgradeIp(req);
    const seated = readSeatTicket(urlTicket(req), code, authSecret()) !== null;
    if (!seated && checkCode(ip, 'found') === 'blocked') {
      refuse(socket, '429 Too Many Requests', `Retry-After: ${codeRetryAfterSeconds(ip)}\r\n`);
      return;
    }
    const room = hub.open(code);
    if (!room) {
      if (!seated) checkCode(ip, 'missing');
      refuse(socket, '404 Not Found');
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
