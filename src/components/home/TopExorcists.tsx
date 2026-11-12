import { useFormatter, useTranslations } from 'next-intl';
import Avatar from '@/components/shared/Avatar';
import ChevronButton, { Chevrons } from '@/components/shared/ChevronButton';
import SpearArrow from '@/components/shared/SpearArrow';
import type { RankedPlayer } from '@/components/leaderboard/leaderboard';
import { Link } from '@/i18n/navigation';

/** Couleur du losange selon le rang : or, argent, bronze, puis neutre. */
const RANK_COLORS = ['text-gold', 'text-secondary', 'text-tertiary'];

const DIAMOND = '[clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]';

// Section « classement » de l'accueil (canvas « Accueil · style flèches ») : titre centré souligné de deux lances,
// photo de profil dans un losange de la couleur du rang, chevrons en bout de rangée et bouton-flèche vers le classement complet.
// Le fond passe du noir à une lueur rouge sombre vers le bas, comme dans le canvas.
export default function TopExorcists({ players }: { players: readonly RankedPlayer[] }) {
  const t = useTranslations('TopExorcists');
  const format = useFormatter();

  return (
    <section aria-labelledby="top-title" className="torn-top relative bg-linear-to-b from-[#0e0e10] to-[#120708] px-6 pt-[110px] pb-25">
      <div className="mx-auto flex max-w-[860px] flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary-text">{t('eyebrow')}</p>
          <h2 id="top-title" className="text-[clamp(34px,4.2vw,52px)] leading-tight uppercase tracking-[0.08em]">{t('title')}</h2>
          <span aria-hidden="true" className="flex items-center gap-2.5 text-primary-text">
            <SpearArrow direction="left" className="h-[30px] w-[90px]" />
            <span className="size-[9px] rotate-45 bg-primary-container" />
            <SpearArrow direction="right" className="h-[30px] w-[90px]" />
          </span>
        </div>

        {players.length === 0 && <p className="w-full border border-dashed border-outline-variant px-6 py-12 text-center text-lg text-on-surface-variant">{t('empty')}</p>}

        <ol className="w-full">
          {players.map((player, i) => (
            <li key={player.username} className="border-b border-[#2a1416]">
              <Link
                href={`/profile/${player.username}`}
                aria-label={t('profileLabel', { name: player.username })}
                className="flex min-h-18 items-center gap-5 px-2 py-3.5 text-on-surface transition-[filter] duration-300 hover:brightness-135 focus-visible:brightness-135 motion-reduce:transition-none"
              >
                <span className={`flex size-13 shrink-0 bg-current p-0.5 ${DIAMOND} ${RANK_COLORS[i] ?? 'text-outline'}`}>
                  <Avatar avatar={player.avatar} name={player.username} src={player.photo} size={48} className={DIAMOND} />
                </span>
                <span className="font-grotesk min-w-0 flex-1 truncate text-[20px]">{player.username}</span>
                <span className="font-label-code hidden text-[13px] text-outline sm:inline">
                  {format.number(player.accuracy, { style: 'percent', maximumFractionDigits: 1 })}
                </span>
                <span className="font-label-code min-w-16 text-right text-[22px] font-bold text-primary">
                  {player.wpm}
                  <span className="ml-1 text-[11px] font-normal text-outline">{t('wpm')}</span>
                </span>
                <Chevrons className="hidden h-10 w-5 shrink-0 -scale-x-100 text-primary-text sm:block" />
              </Link>
            </li>
          ))}
        </ol>

        <ChevronButton as={Link} href="/leaderboard" className="text-sm uppercase tracking-[0.16em] whitespace-nowrap">
          {t('cta')}
        </ChevronButton>
      </div>
    </section>
  );
}
