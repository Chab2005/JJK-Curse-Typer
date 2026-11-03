'use client';

import { useSyncExternalStore } from 'react';
import { detectOs, type Os } from '@/lib/platform';

// L'agent ne change pas pendant la visite : rien à écouter.
const subscribe = () => () => {};

/** Système du visiteur. Le serveur et l'hydratation rendent « other » (touche Alt), puis le client corrige. */
export const useOs = (): Os => useSyncExternalStore(subscribe, () => detectOs(navigator.userAgent), () => 'other');
