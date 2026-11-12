import { useTranslations } from 'next-intl';

// Pastille « Bot » (BOT-04) : un bot se reconnaît à la piste, au tableau et au podium, pas seulement à son nom.
export default function BotBadge({ className = '' }: { className?: string }) {
  const t = useTranslations('Race');

  return (
    <span data-testid="bot-badge" className={`font-label-code inline-flex shrink-0 items-center gap-0.5 border border-secondary/60 px-1 text-[10px] leading-4 font-bold tracking-[0.1em] text-secondary uppercase ${className}`}>
      <span aria-hidden="true" className="material-symbols-outlined text-[11px]!">smart_toy</span>
      {t('bot')}
    </span>
  );
}
