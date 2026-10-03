const MIN_DURATION = 400;
const MAX_DURATION = 1000;

/** Courbe lente au départ, rapide au milieu, lente à l'arrivée. */
export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2;
}

/** Position de défilement après `elapsed` ms sur une animation de `duration` ms. */
export function scrollPositionAt(from: number, to: number, elapsed: number, duration: number): number {
  if (duration <= 0 || elapsed >= duration) return to;
  return from + (to - from) * easeInOutCubic(elapsed / duration);
}

/** Durée en ms selon la distance en px : courte pour un petit saut, plafonnée pour un long. */
export function scrollDuration(distance: number): number {
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, 300 + Math.abs(distance) * 0.5));
}
