import Image from 'next/image';
import { initials } from '@/lib/initials';
import { faceCrop } from './characterImages';
import { CHARACTERS, type CharacterId } from './characters';

// Avatar rond (ou biseauté) : photo téléversée (PROF-5), sinon visage du personnage choisi (PROF-1), sinon les deux premières lettres du pseudo.
export default function Avatar({ avatar, name, size, src = null, shape = 'round', className = '' }: { avatar: CharacterId | null; name: string; size: number; src?: string | null; shape?: 'round' | 'bevel'; className?: string }) {
  const character = CHARACTERS.find((c) => c.id === avatar);

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-surface-container-highest ${shape === 'bevel' ? 'bevel' : 'rounded-[50%]'} ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        // Photo téléversée (PROF-5), déjà redimensionnée côté serveur.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" width={size} height={size} className="size-full object-cover" />
      ) : character ? (
        <Image
          src={`/images/characters/${character.id}.webp`}
          alt=""
          width={904}
          height={1270}
          unoptimized
          style={faceCrop(character.face, size)}
          className="absolute h-auto max-w-none"
        />
      ) : (
        <span aria-hidden="true" className="font-grotesk font-bold text-on-surface" style={{ fontSize: Math.round(size * 0.36) }}>
          {initials(name)}
        </span>
      )}
    </span>
  );
}
