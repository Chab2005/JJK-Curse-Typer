'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { raceSocketPath, type ClientMessage, type ServerMessage } from '@/game/protocol';

export type SocketStatus = 'connecting' | 'open' | 'lost';

const GUEST_KEY = 'race-guest';
/** Attente avant de se reconnecter : de 0,5 s à 5 s (TECH-9). */
const RETRY_MS = { first: 500, max: 5000 };

/** Identifiant d'invité propre à l'onglet : il retrouve son siège après une coupure (RACE-13). */
function guestId(): string {
  const fresh = () => globalThis.crypto?.randomUUID?.() ?? `guest-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  try {
    const saved = sessionStorage.getItem(GUEST_KEY);
    if (saved) return saved;
    const id = fresh();
    sessionStorage.setItem(GUEST_KEY, id);
    return id;
  } catch {
    return fresh();
  }
}

// WebSocket de la course `code`, sur le même hôte que la page (server.ts) ; reconnexion automatique.
// `ticket` : siège signé du joueur dans un lobby créé (src/realtime/ticket.ts).
export function useRaceSocket(code: string, onMessage: (message: ServerMessage) => void, ticket?: string) {
  const [status, setStatus] = useState<SocketStatus>('connecting');
  const socketRef = useRef<WebSocket | null>(null);
  const handlerRef = useRef(onMessage);

  useEffect(() => {
    handlerRef.current = onMessage;
  });

  useEffect(() => {
    let disposed = false;
    let retries = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${window.location.host}${raceSocketPath(code)}`);
      socketRef.current = socket;
      socket.onopen = () => {
        retries = 0;
        setStatus('open');
        socket.send(JSON.stringify({ type: 'join', guest: guestId(), ...(ticket && { ticket }) } satisfies ClientMessage));
      };
      socket.onmessage = (event) => {
        try {
          handlerRef.current(JSON.parse(String(event.data)) as ServerMessage);
        } catch {
          // Message illisible : ignoré, le prochain tick resynchronise l'écran.
        }
      };
      socket.onclose = () => {
        if (disposed) return;
        setStatus('lost');
        retryTimer = setTimeout(connect, Math.min(RETRY_MS.max, RETRY_MS.first * 2 ** retries++));
      };
    };

    connect();
    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      socketRef.current?.close();
    };
  }, [code, ticket]);

  const send = useCallback((message: ClientMessage) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
  }, []);

  return { status, send };
}
