'use client';

import { useEffect, useRef } from 'react';
import type { LobbyRoom } from './lobbyRoom';

// Flux temps réel d'un lobby créé (/api/lobbies/<code>/events) : `onRoom` à chaque changement, `onGone` quand
// le visiteur n'y est plus (expulsé, parti) ou que le lobby a fermé. Le navigateur se reconnecte seul après une coupure.
// Tenir le flux ouvert garde aussi la place du visiteur dans le lobby. `code` à `null` : pas de flux.
export function useLobbyEvents(code: string | null, onRoom: (room: LobbyRoom) => void, onGone: () => void) {
  const handlers = useRef({ onRoom, onGone });

  useEffect(() => {
    handlers.current = { onRoom, onGone };
  });

  useEffect(() => {
    if (!code || typeof EventSource === 'undefined') return;
    const source = new EventSource(`/api/lobbies/${encodeURIComponent(code)}/events`);
    const gone = () => {
      source.close();
      handlers.current.onGone();
    };
    source.onmessage = (event) => {
      try {
        handlers.current.onRoom(JSON.parse(String(event.data)) as LobbyRoom);
      } catch {
        // Message illisible : ignoré, le suivant remet l'écran à jour.
      }
    };
    source.addEventListener('gone', gone);
    // Refus du serveur (lobby fermé, plus dans le salon) : le navigateur ne retente pas.
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) gone();
    };
    return () => source.close();
  }, [code]);
}
