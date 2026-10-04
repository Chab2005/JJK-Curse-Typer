// Limitation des tentatives de connexion par compte et par adresse IP (AUTH-7). Logique pure.

export const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export interface AttemptState {
  count: number;
  windowStart: number;
}

const expired = (state: AttemptState, now: number) => now - state.windowStart >= LOGIN_WINDOW_MS;

export function isBlocked(state: AttemptState | null, now: number): boolean {
  return state !== null && !expired(state, now) && state.count >= LOGIN_MAX_ATTEMPTS;
}

export function registerFailure(state: AttemptState | null, now: number): AttemptState {
  if (!state || expired(state, now)) return { count: 1, windowStart: now };
  return { count: state.count + 1, windowStart: state.windowStart };
}
