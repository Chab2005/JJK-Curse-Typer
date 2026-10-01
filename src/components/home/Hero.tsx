import { useTranslations } from 'next-intl';

export default function Hero() {
  const t = useTranslations('Hero');

  return (
    <section className="flex flex-col items-center text-center max-w-3xl mx-auto">
      <h1
        className="font-display-hero text-headline-lg lg:text-display-hero uppercase tracking-tight text-on-surface"
        style={{ fontFamily: 'var(--font-fondamento), cursive, sans-serif' }}
      >
        {t.rich('title', {
          accent: (chunks) => <span className="text-primary tracking-normal">{chunks}</span>,
        })}
      </h1>
      <p className="mt-space-xs font-body-regular text-body-regular text-on-surface-variant max-w-xl">
        {t('intro')}
      </p>
    </section>
  );
}
