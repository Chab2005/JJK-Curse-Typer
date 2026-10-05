// Photo de profil téléversée (PROF-5) : JPEG, PNG ou WebP, 2 Mo au plus. Le type est lu dans les octets du fichier.

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
/** Côté du carré dans lequel l'image est redimensionnée avant d'être stockée. */
export const AVATAR_SIZE = 256;

/** URL publique de la photo de `username` ; `?v=` change à chaque téléversement, l'image reste donc cacheable à vie. */
export function avatarUrl(username: string, version: number): string {
  return `/api/avatar/${encodeURIComponent(username)}?v=${version}`;
}

export type ImageType = 'jpeg' | 'png' | 'webp';

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) => signature.every((b, i) => bytes[offset + i] === b);

export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return 'webp';
  return null;
}

export function validateAvatarFile(bytes: Uint8Array): 'size' | 'type' | null {
  if (bytes.byteLength === 0 || bytes.byteLength > AVATAR_MAX_BYTES) return 'size';
  return detectImageType(bytes) ? null : 'type';
}
