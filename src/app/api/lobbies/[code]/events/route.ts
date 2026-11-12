import type { NextRequest } from 'next/server';
import { clientIp, isInside } from '@/components/lobby/lobbyAccess';
import type { LobbyRoom } from '@/components/lobby/lobbyRoom';
import { checkCode, codeRetryAfterSeconds } from '@/lib/codeGuard';
import { getViewerId } from '@/lib/currentUser';
import { storedLobby, subscribeLobby } from '@/lib/lobbies';
import { connectViewer } from '@/lib/lobbyPresence';
import { lobbyCodeSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

/** `decodeURIComponent` qui ne lève pas sur un pourcentage mal formé : le schéma refusera la valeur. */
function decodeURIComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return '';
  }
}

/** Commentaire envoyé régulièrement : un proxy ne coupe pas un flux resté muet. */
const HEARTBEAT_MS = 25_000;

// Flux temps réel d'un lobby créé (Server-Sent Events) : le lobby entier à chaque changement, puis `gone`
// quand le visiteur n'y est plus (expulsé, parti) ou que le lobby ferme. Tenir ce flux ouvert compte comme
// présence dans le lobby (src/lib/lobbyPresence.ts). Réservé à qui est dans le salon ; un refus compte dans la limite
// de tentatives par IP (SALLE-10), et une IP bloquée reçoit 429.
export async function GET(request: NextRequest, { params }: RouteContext<'/api/lobbies/[code]/events'>) {
  const code = lobbyCodeSchema.safeParse(decodeURIComponentSafe((await params).code));
  const viewerId = await getViewerId();
  const room = code.success ? storedLobby(code.data) : null;
  if (!room || !viewerId || !isInside(room, viewerId)) {
    // Hors du salon, le flux est toujours refusé : chaque refus compte comme un code essayé (SALLE-10).
    const ip = clientIp(request.headers);
    if (checkCode(ip, 'missing') === 'blocked') return new Response(null, { status: 429, headers: { 'Retry-After': String(codeRetryAfterSeconds(ip)) } });
    return new Response(null, { status: 404 });
  }

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const write = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };
      const send = (next: LobbyRoom | null) => {
        if (next && isInside(next, viewerId)) return write(`data: ${JSON.stringify(next)}\n\n`);
        // `closed` : le salon n'existe plus (fermé par l'hôte, COURSE-11, ou vidé) ; `left` : le visiteur n'y est plus.
        write(`event: gone\ndata: ${next ? 'left' : 'closed'}\n\n`);
        cleanup();
        try {
          controller.close();
        } catch {
          // Déjà fermé par le navigateur.
        }
      };

      const unsubscribe = subscribeLobby(room.code, send);
      const release = connectViewer(room.code, viewerId);
      const heartbeat = setInterval(() => write(': ping\n\n'), HEARTBEAT_MS);
      let done = false;
      cleanup = () => {
        if (done) return;
        done = true;
        clearInterval(heartbeat);
        unsubscribe();
        release();
      };
      request.signal.addEventListener('abort', cleanup);
      // Le lobby a pu changer depuis la vérification d'accès.
      send(storedLobby(room.code));
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      // `no-transform` : ni la compression de Next ni un proxy ne retiennent les événements.
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
