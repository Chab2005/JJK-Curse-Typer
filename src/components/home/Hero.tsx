import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import BlackFlash from './BlackFlash';
import SmoothScrollLink from './SmoothScrollLink';

// `onlineCount` : `null` tant qu'il n'existe pas de vrai compteur (le chiffre de démonstration est masqué en production).
export default function Hero({ onlineCount }: { onlineCount: number | null }) {
  const t = useTranslations('Hero');

  return (
    <section
      aria-labelledby="hero-title"
      className="torn-bottom relative -mt-19 flex min-h-[860px] items-center justify-center overflow-hidden bg-surface-container-lowest px-6 pt-[150px] pb-[140px]"
    >
      {/* Énergie occulte : halo, éclairs Black Flash et taches */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_45%_at_50%_50%,rgb(225_29_72/0.4),rgb(147_0_10/0.18)_45%,transparent_75%)]" />
      <BlackFlash />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_78%,rgb(147_0_10/0.35),transparent_22%),radial-gradient(circle_at_86%_22%,rgb(147_0_10/0.3),transparent_24%),radial-gradient(circle_at_14%_22%,rgb(147_0_10/0.3),transparent_24%),radial-gradient(circle_at_78%_88%,rgb(147_0_10/0.25),transparent_18%)]" />
      <p aria-hidden="true" className="hidden lg:block absolute left-10 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl] whitespace-nowrap font-label-code text-[11px] uppercase tracking-[0.5em] text-outline-variant">
        {t('sideLeft')}
      </p>
      <p aria-hidden="true" className="hidden lg:block absolute right-10 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl] whitespace-nowrap font-label-code text-[11px] uppercase tracking-[0.5em] text-outline-variant">
        {t('sideRight')}
      </p>

      <div className="relative flex max-w-[900px] flex-col items-center gap-6 text-center">
        <p className="italic leading-snug text-[clamp(20px,2.2vw,28px)] tracking-[0.04em] text-on-primary-container [text-shadow:0_2px_12px_rgb(0_0_0/0.8)]">
          {t('tagline')}
        </p>

        <h1 id="hero-title" className="flex flex-col items-center gap-5">
          <span className="relative block w-[min(92vw,860px)] py-7">
            <Image
              src="/images/jjk-logo.png"
              alt={t('logoAlt')}
              width={1164}
              height={271}
              priority
              sizes="(max-width: 935px) 92vw, 860px"
              className="relative h-auto w-full [filter:drop-shadow(0_0_1px_#f5d77a)_drop-shadow(0_0_2px_#c9972f)_drop-shadow(0_10px_24px_rgb(0_0_0/0.8))]"
            />
          </span>
          <span className="text-[clamp(30px,4vw,52px)] leading-none uppercase tracking-[0.22em] text-primary [text-shadow:0_0_26px_rgb(225_29_72/0.7)]">
            Curse Typer
          </span>
        </h1>

        <div className="flex items-center gap-3.5 text-on-surface-variant">
          <span aria-hidden="true" className="h-px w-15 bg-linear-to-r from-transparent to-primary-container" />
          <span className="text-[15px] uppercase tracking-[0.28em]">{t('subtitle')}</span>
          <span aria-hidden="true" className="h-px w-15 bg-linear-to-r from-primary-container to-transparent" />
        </div>

        <p className="leading-snug text-[clamp(24px,2.8vw,32px)] uppercase tracking-widest text-on-primary-container">
          {t('arenasOpen')}{' '}
          {onlineCount !== null && (
            <span className="font-label-code align-middle text-[0.5em] tracking-widest text-tertiary">
              {t('online', { count: onlineCount })}
            </span>
          )}
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/lobbies" className="group bevel inline-flex bg-linear-135 from-gold to-gold-deep p-px transition-transform hover:-translate-y-0.5">
            <span className="bevel flex min-h-[58px] items-center gap-3 bg-primary-container px-[34px] text-[19px] uppercase tracking-[0.12em] text-on-primary-container transition-colors group-hover:bg-inverse-primary">
              <span aria-hidden="true" className="material-symbols-outlined text-[22px]">swords</span>
              {t('play')}
            </span>
          </Link>
          <SmoothScrollLink href="#join" className="group bevel inline-flex bg-outline p-px transition-transform hover:-translate-y-0.5">
            <span className="bevel flex min-h-[58px] items-center gap-2.5 bg-surface-container-lowest px-[30px] text-[17px] uppercase tracking-[0.12em] text-on-surface transition-colors group-hover:bg-surface-container-high">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-primary">pin</span>
              {t('joinByCode')}
            </span>
          </SmoothScrollLink>
        </div>
      </div>
    </section>
  );
}
