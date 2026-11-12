import { useTranslations } from 'next-intl';
import RaceSummary from '@/components/race/RaceSummary';
import ChevronButton from '@/components/shared/ChevronButton';
import PageIntro from '@/components/shared/PageIntro';
import { Link } from '@/i18n/navigation';
import type { PastRaceView as View } from './pastRace';

// Corps de la page d'une course passée (HIST-02), la sienne ou celle d'un autre joueur : en-tête, note pour une course
// d'avant l'archivage, puis les composants de l'écran de résultats (podium, tableau, courbe du MPM, touches ratées).
export default function PastRaceView({
  eyebrow,
  title,
  intro,
  lobbyCode,
  legacy,
  view,
  back,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  /** Code du salon de la course, `null` pour une course d'avant l'archivage. */
  lobbyCode: string | null;
  legacy: boolean;
  view: View;
  back: { href: string; label: string };
}) {
  const t = useTranslations('History.race');

  return (
    <div className="relative mx-auto flex max-w-[1100px] flex-col gap-8 px-6 pt-14 pb-24">
      <PageIntro id="past-race-title" eyebrow={eyebrow} title={title} intro={intro} watermark={lobbyCode ?? '—'} chevrons />
      {legacy && (
        <p role="note" className="border-l-[3px] border-secondary bg-secondary-container/20 px-5 py-4 text-on-surface-variant">
          {t('legacyNote')}
        </p>
      )}
      <RaceSummary
        rows={view.rows}
        you={view.you}
        over
        series={view.series}
        lobbyCode={lobbyCode ?? ''}
        actions={
          <ChevronButton as={Link} href={back.href} variant="primary" frame="self-start" className="text-[15px] uppercase tracking-[0.12em]">
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">arrow_back</span>
            {back.label}
          </ChevronButton>
        }
      />
    </div>
  );
}
