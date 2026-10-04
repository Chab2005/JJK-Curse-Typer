import { useTranslations } from 'next-intl';
import type { LobbySummary } from '@/components/lobbies/lobbySearch';
import JoinForm from './JoinForm';
import PublicLobbies from './PublicLobbies';

export default function JoinSection({ publicLobbies, accountName = null, showSamples = true }: { publicLobbies?: LobbySummary[]; accountName?: string | null; showSamples?: boolean }) {
  const t = useTranslations('JoinSection');

  return (
    <section id="join" aria-labelledby="join-title" className="relative -mt-[26px] scroll-mt-19 overflow-hidden bg-surface px-6 py-24">
      <p aria-hidden="true" className="text-stroke-ghost pointer-events-none absolute left-1/2 top-6 hidden -translate-x-1/2 whitespace-nowrap text-[190px] uppercase leading-none tracking-[0.08em] lg:block">
        {t('watermark')}
      </p>
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary-container">{t('eyebrow')}</p>
          <h2 id="join-title" className="text-[clamp(36px,4.5vw,56px)] leading-tight uppercase tracking-[0.08em]">{t('title')}</h2>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-start gap-7">
          <JoinForm accountName={accountName} />
          <PublicLobbies created={publicLobbies} showSamples={showSamples} />
        </div>
      </div>
    </section>
  );
}
