import { useTranslations } from 'next-intl';
import type { LobbySummary } from '@/components/lobbies/lobbySearch';
import SpearArrow from '@/components/shared/SpearArrow';
import JoinForm from './JoinForm';
import PublicLobbies from './PublicLobbies';

export default function JoinSection({ publicLobbies, accountName = null, showSamples = true }: { publicLobbies?: LobbySummary[]; accountName?: string | null; showSamples?: boolean }) {
  const t = useTranslations('JoinSection');

  return (
    <section id="join" aria-labelledby="join-title" className="relative -mt-[26px] scroll-mt-19 overflow-hidden bg-linear-to-b from-[#0e0e10] to-[#120708] px-6 py-24">
      {/* Lueur rouge au centre de la section, qui prolonge l'amorce du bas du héros */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_50%_50%,rgb(147_0_10/0.22),rgb(147_0_10/0.07)_50%,transparent_70%),linear-gradient(to_bottom,transparent_70%,rgb(14_14_16))]" />
      <p aria-hidden="true" className="text-stroke-ghost pointer-events-none absolute left-1/2 top-6 hidden -translate-x-1/2 whitespace-nowrap text-[190px] uppercase leading-none tracking-[0.08em] lg:block">
        {t('watermark')}
      </p>
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary-container">{t('eyebrow')}</p>
          <h2 id="join-title" className="text-[clamp(36px,4.5vw,56px)] leading-tight uppercase tracking-[0.08em]">{t('title')}</h2>
          <span aria-hidden="true" className="mt-1 flex items-center gap-2.5 text-primary-container">
            <SpearArrow direction="left" className="h-[30px] w-[90px]" />
            <span className="size-[9px] rotate-45 bg-primary-container" />
            <SpearArrow direction="right" className="h-[30px] w-[90px]" />
          </span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-start gap-7">
          <JoinForm accountName={accountName} />
          <PublicLobbies created={publicLobbies} showSamples={showSamples} />
        </div>
      </div>
    </section>
  );
}
