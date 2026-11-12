'use client';

import { useEffect, useRef } from 'react';
import type { LobbyRoom } from './lobbyRoom';

/** Pourquoi le flux s'arrête : `closed`, le lobby n'existe plus (fermé par l'hôte, COURSE-11) ; `left`, le visiteur n'y est plus. */
export type GoneReason = 'closed' | 'left';

// Flux temps réel d'un lobby créé (/api/lobbies/<code>/events) : `onRoom` à chaque changement, `onGone` quand
// le visiteur n'y est plus (expulsé, parti) ou que le lobby a fermé. Le navigateur se reconnecte seul après une coupure.
// Tenir le flux ouvert garde aussi la place du visiteur dans le lobby. `code` à `null` : pas de flux.
export function useLobbyEvents(code: string | null, onRoom: (room: LobbyRoom) => void, onGone: (reason: GoneReason) => void) {
  const handlers = useRef({ onRoom, onGone });

  useEffect(() => {
    handlers.current = { onRoom, onGone };
  });

  useEffect(() => {
    if (!code || typeof EventSource === 'undefined') return;
    const source = new EventSource(`/api/lobbies/${encodeURIComponent(code)}/events`);
    const gone = (reason: GoneReason) => {
      source.close();
      handlers.current.onGone(reason);
    };
    source.onmessage = (event) => {
      try {
        handlers.current.onRoom(JSON.parse(String(event.data)) as LobbyRoom);
      } catch {
        // Message illisible : ignoré, le suivant remet l'écran à jour.
      }
    };
    source.addEventListener('gone', (event) => gone((event as MessageEvent).data === 'closed' ? 'closed' : 'left'));
    // Refus du serveur (lobby fermé, plus dans le salon) : le navigateur ne retente pas.
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) gone('left');
    };
    return () => source.close();
  }, [code]);
}
