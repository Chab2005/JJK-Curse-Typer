import PixelDomain from '@/components/characters/PixelDomain';
import type { DomainOwner } from '@/game/abilities';

// Territoire ouvert : il se déploie derrière tout l'écran de course. Le voile garde le texte lisible.
export default function DomainBackdrop({ domain }: { domain: DomainOwner }) {
  return (
    <div aria-hidden="true" data-testid="race-domain" className="race-domain pointer-events-none fixed inset-0 z-0">
      <PixelDomain character={domain} showCharacter={false} fill />
      <div className="absolute inset-0 bg-black/45" />
    </div>
  );
}
