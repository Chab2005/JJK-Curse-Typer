import 'server-only';
import { hash, verify } from '@node-rs/argon2';

// Mots de passe hachés et salés avec argon2id (AUTH-7) ; le sel est généré et inclus dans le hash.
export const hashPassword = (password: string) => hash(password);

export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  try {
    return await verify(stored, password);
  } catch {
    return false;
  }
}

// Hash factice : on vérifie quand même un mot de passe pour un compte inconnu, afin que le temps de réponse ne révèle pas s'il existe.
let dummy: Promise<string> | undefined;
export function dummyVerify(password: string): Promise<boolean> {
  dummy ??= hash('not-a-real-password');
  return dummy.then((h) => verifyPassword(h, password));
}
