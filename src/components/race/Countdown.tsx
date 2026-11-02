import { useTranslations } from 'next-intl';
import { Chevrons } from '@/components/shared/ChevronButton';
import HexCard from '@/components/shared/HexCard';

// Décompte animé avant le départ, puis le signal (RACE-1, GEN-4) : le chiffre dans la plaque cramoisie
// des boutons-flèches, flanquée de leurs chevrons.
export default function Countdown({ seconds }: { seconds: number }) {
  const t = useTranslations('Race.countdown');

  return (
    <div role="status" aria-label={t('label')} className="flex items-center justify-center gap-2">
      <span aria-hidden="true" className="flex h-24 w-9 text-primary-container">
        <Chevrons className="size-full" />
      </span>
      <span key={seconds} className="race-pop drop-shadow-[0_0_30px_rgb(225_29_72/0.45)]">
        <HexCard className="flex min-w-48 items-center justify-center bg-linear-to-b from-[#e11d48] via-[#a3102f] to-[#6e0718] px-14 py-4 font-grotesk text-[88px] leading-none font-bold text-on-primary-container [text-shadow:0_2px_18px_rgb(0_0_0/0.45)]">
          {seconds > 0 ? seconds : t('go')}
        </HexCard>
      </span>
      <span aria-hidden="true" className="flex h-24 w-9 -scale-x-100 text-primary-container">
        <Chevrons className="size-full" />
      </span>
    </div>
  );
}
