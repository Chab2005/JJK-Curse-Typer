import { useTranslations } from 'next-intl';

// Décompte animé avant le départ, puis le signal (RACE-1, GEN-4).
export default function Countdown({ seconds }: { seconds: number }) {
  const t = useTranslations('Race.countdown');

  return (
    <div role="status" aria-label={t('label')} className="flex items-center justify-center">
      <span
        key={seconds}
        className="race-pop flex min-w-36 items-center justify-center rounded-full bg-surface-container-lowest/90 px-6 py-5 font-grotesk text-[88px] leading-none font-bold text-primary ring-2 ring-primary-container [text-shadow:0_0_24px_rgb(225_29_72/0.6)] shadow-[0_0_40px_rgb(225_29_72/0.35)]"
      >
        {seconds > 0 ? seconds : t('go')}
      </span>
    </div>
  );
}
