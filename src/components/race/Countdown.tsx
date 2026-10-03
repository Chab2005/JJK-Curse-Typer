import { useTranslations } from 'next-intl';

// Décompte animé avant le départ, puis le signal (RACE-1, GEN-4).
export default function Countdown({ seconds }: { seconds: number }) {
  const t = useTranslations('Race.countdown');

  return (
    <div role="status" aria-label={t('label')} className="flex items-center justify-center">
      <span key={seconds} className="race-pop font-grotesk text-[96px] leading-none font-bold text-primary [text-shadow:0_0_24px_rgb(225_29_72/0.6)]">
        {seconds > 0 ? seconds : t('go')}
      </span>
    </div>
  );
}
