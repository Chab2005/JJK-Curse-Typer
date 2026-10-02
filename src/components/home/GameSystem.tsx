import { useTranslations } from 'next-intl';

const FACTS = [
  { key: 'players', icon: 'groups' },
  { key: 'timer', icon: 'timer' },
  { key: 'bots', icon: 'smart_toy' },
  { key: 'languages', icon: 'translate' },
] as const;

export default function GameSystem() {
  const t = useTranslations('GameSystem');

  return (
    <section aria-labelledby="system-title" className="torn-top relative overflow-hidden bg-[#1a0f11] px-6 pt-30 pb-[110px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgb(147_0_10/0.55),transparent_70%),radial-gradient(circle_at_15%_70%,rgb(147_0_10/0.25),transparent_30%),radial-gradient(circle_at_90%_85%,rgb(147_0_10/0.2),transparent_25%)]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(115deg,rgb(225_29_72/0.07)_0_2px,transparent_2px_60px)]" />

      <div className="relative mx-auto flex max-w-[1080px] flex-col items-center gap-14 text-center">
        <div className="flex flex-col items-center gap-2">
          <p className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary">{t('eyebrow')}</p>
          <h2 id="system-title" className="text-[clamp(34px,4.6vw,60px)] leading-[1.15] text-on-primary-container">
            {t('titleLine1')}
            <br />
            {t('titleLine2')}
          </h2>
          <p className="mt-3.5 max-w-[620px] text-lg leading-7 text-on-surface-variant">{t('intro')}</p>
        </div>

        <dl className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] border-y border-primary/25">
          {FACTS.map(({ key, icon }) => (
            <div key={key} className="flex flex-col-reverse items-center gap-1.5 border-r border-primary/10 px-5 py-8 last:border-r-0">
              <dt className="font-occult text-base text-on-surface-variant">{t(`facts.${key}.label`)}</dt>
              <dd className="font-grotesk text-[52px] font-bold leading-[1.05] text-on-primary-container">{t(`facts.${key}.value`)}</dd>
              <span aria-hidden="true" className="material-symbols-outlined text-[26px] text-primary-container">{icon}</span>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
