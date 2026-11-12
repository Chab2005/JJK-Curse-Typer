'use client';

import QuickPlayAlert from '@/components/home/QuickPlayAlert';
import { useQuickPlay } from '@/components/home/useQuickPlay';
import ChevronButton from '@/components/shared/ChevronButton';
import type { CharacterId } from '@/components/shared/characters';
import { useRouter } from '@/i18n/navigation';

// « Jouer X » sur la fiche : même entrée directe que l'accueil, avec ce personnage déjà choisi.
export default function PlayCharacterButton({ character, label, className }: { character: CharacterId; label: string; className: string }) {
  const router = useRouter();
  const { play, createPublic, isPending, problem } = useQuickPlay({ character, onNeedName: () => router.push('/#join') });

  return (
    <div className={`relative ${className}`}>
      <ChevronButton type="button" onClick={play} disabled={isPending} aria-busy={isPending} className="gap-2.5 text-sm uppercase tracking-[0.16em] whitespace-nowrap">
        {label}
        <span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_forward</span>
      </ChevronButton>
      {problem && <QuickPlayAlert problem={problem} onCreate={createPublic} className="absolute top-full right-0 mt-3 w-max max-w-[320px] text-right" />}
    </div>
  );
}
