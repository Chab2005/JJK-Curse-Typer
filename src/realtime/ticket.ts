// Ticket de course : la page de course (serveur Next) signe le siège du joueur, la room de course le vérifie.
// Un spectateur n'en a pas, il ne peut donc pas prendre la place d'un joueur absent.
import { sign, verify } from '@/lib/auth/signedCookie';

const normalize = (code: string) => code.trim().toUpperCase();

export function seatTicket(code: string, seat: string, secret: string): string {
  return sign({ code: normalize(code), seat }, secret);
}

/** Siège donné par `ticket` dans la course du lobby `code`, ou `null` s'il est absent, falsifié ou d'un autre lobby. */
export function readSeatTicket(ticket: string | undefined, code: string, secret: string): string | null {
  const value = verify(ticket, secret) as { code?: unknown; seat?: unknown } | null;
  if (!value || value.code !== normalize(code) || typeof value.seat !== 'string') return null;
  return value.seat;
}
