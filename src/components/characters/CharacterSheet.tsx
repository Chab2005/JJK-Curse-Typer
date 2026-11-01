import type { CSSProperties } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import ChevronButton from '@/components/shared/ChevronButton';
import SpearArrow from '@/components/shared/SpearArrow';
import { Link } from '@/i18n/navigation';
import BevelFrame, { cardFrame } from '@/components/shared/BevelFrame';
import { faceFrame } from '@/components/shared/characterImages';
import { CHARACTERS, type Character } from '@/components/shared/characters';
import { neighbours } from './characterPages';
import { CHARACTER_STYLES } from './characterStyles';
import { SPRITES, spriteBox } from './characterSprites';

/** Vignettes des autres fiches : illustration cadrée sur le buste. */
const MINI_WIDTH = 300;
const MINI_FACE_Y = 70;

// Fiche d'un personnage (/characters/<id>) : illustration en pied, technique, capacité en course,
// puis les fiches voisines et la bande des huit exorcistes.
export default function CharacterSheet({ character }: { character: Character }) {
  const t = useTranslations('Character');
  const page = useTranslations('CharactersPage');
  const techniques = useTranslations('Characters.techniques');
  const style = CHARACTER_STYLES[character.id];
  const { prev, next } = neighbours(character.id);
  const idle = spriteBox(SPRITES[character.id].idle);
  const running = spriteBox(SPRITES[character.id].running);

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[900px] bg-[radial-gradient(ellipse_50%_60%_at_25%_40%,rgb(147_0_10/0.3),transparent_70%)]" />
      <div className="relative mx-auto flex max-w-[1152px] flex-col gap-7 px-6 pt-7 pb-24">
        <nav aria-label={t('breadcrumb')} className="font-label-code flex items-center gap-2.5 text-[12px] uppercase tracking-[0.14em]">
          <Link href="/characters" className="font-label-code text-outline hover:text-primary">{page('eyebrow')}</Link>
          <span aria-hidden="true" className="font-label-code text-outline-variant">/</span>
          <span aria-current="page" className="font-label-code text-on-surface">{character.name}</span>
        </nav>

        <article aria-labelledby="character-name" className="grid items-start gap-7 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12">
          <div className={`torn-bottom relative h-[520px] overflow-hidden shadow-[inset_0_0_0_1px_#2a2a2c] lg:h-[780px] ${style.tint}`}>
            <Image
              src={`/images/characters/${character.id}.webp`}
              alt={t('portraitAlt', { name: character.name })}
              width={904}
              height={1270}
              unoptimized
              priority
              className="absolute bottom-0 left-1/2 h-[96%] w-auto max-w-none -translate-x-1/2 drop-shadow-[0_24px_30px_rgb(0_0_0/0.6)]"
            />
            <div aria-hidden="true" className="group/sprite absolute right-4 bottom-10 h-[133px] w-[128px] lg:right-8 lg:bottom-14">
              <div
                className="absolute right-0 bottom-0 [image-rendering:pixelated] group-hover/sprite:hidden"
                style={{ width: idle.width, height: idle.height, background: `url(/images/characters/anim/${character.id}-idle.png) 0 0 / ${idle.sheetWidth}px ${idle.height}px no-repeat`, animation: 'sprite-idle 0.9s steps(8) infinite', '--sprite-end': `-${idle.sheetWidth}px` } as CSSProperties}
              />
              <div
                className="absolute right-0 bottom-0 hidden [image-rendering:pixelated] group-hover/sprite:block"
                style={{ width: running.width, height: running.height, background: `url(/images/characters/anim/${character.id}-running.png) 0 0 / ${running.sheetWidth}px ${running.height}px no-repeat`, animation: 'sprite-running 0.875s steps(7) infinite reverse', '--sprite-end': `-${running.width * 7}px` } as CSSProperties}
              />
            </div>
          </div>

          <div className="flex flex-col gap-[22px] pt-3">
            <h1 id="character-name" className="font-grotesk text-[clamp(40px,5vw,64px)] leading-none font-bold uppercase tracking-[0.02em] text-on-primary-container">
              {character.name}
            </h1>
            <p className="text-[17px] leading-[27px] text-on-surface-variant">{t(`descriptions.${character.id}`)}</p>

            <BevelFrame frame={cardFrame} className="flex flex-col gap-2.5 bg-surface px-6 py-[22px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-label-code text-[11px] font-bold uppercase tracking-[0.24em] text-outline">{t('techniqueTitle')}</h2>
                <p className={`text-xl ${style.ink}`}>{techniques(character.id)}</p>
              </div>
              <p className="text-base leading-[25px]">{t(`techniqueDetails.${character.id}`)}</p>
            </BevelFrame>

            <div className="bevel flex items-start gap-4 bg-surface-container-low px-6 py-[22px]">
              <span aria-hidden="true" className="material-symbols-outlined text-[28px] text-tertiary">bolt</span>
              <div className="flex flex-col gap-1.5">
                <h2 className="font-label-code text-[11px] font-bold uppercase tracking-[0.24em] text-outline">{t('abilityTitle')}</h2>
                <p className="text-lg leading-[27px]">{t('abilitySoon')}</p>
                <p className="text-[15px] leading-6 text-on-surface-variant">{t('abilitySoonText')}</p>
              </div>
            </div>

            <ChevronButton as={Link} href="/lobbies" frame="self-start" className="gap-2.5 text-sm uppercase tracking-[0.16em] whitespace-nowrap">
              {t('play', { name: character.name.split(' ')[0] })}
              <span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_forward</span>
            </ChevronButton>
          </div>
        </article>

        <nav aria-label={t('otherFiles')} className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <Link href={`/characters/${prev.id}`} className="group flex min-h-[72px] items-center gap-3.5 border border-surface-container-high bg-surface px-[18px] py-3 transition-colors hover:bg-surface-container-low">
            <SpearArrow direction="left" className="h-6 w-18 shrink-0 text-primary-container transition-[translate,filter] duration-300 group-hover:-translate-x-1.5 group-hover:brightness-140 motion-reduce:transition-none" />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-label-code text-[11px] uppercase tracking-[0.16em] text-outline">{t('previous')}</span>
              <span className="font-grotesk truncate text-[17px] font-semibold text-on-surface group-hover:text-primary">{prev.name}</span>
            </span>
          </Link>
          <Link
            href="/characters"
            className="font-label-code order-3 col-span-2 flex min-h-[72px] items-center justify-center gap-2.5 border border-on-surface px-7 text-[12px] uppercase tracking-[0.2em] text-on-surface transition-colors hover:bg-on-surface hover:text-surface-container-lowest lg:order-none lg:col-span-1"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-lg">grid_view</span>
            {t('all')}
          </Link>
          <Link href={`/characters/${next.id}`} className="group flex min-h-[72px] items-center justify-end gap-3.5 border border-surface-container-high bg-surface px-[18px] py-3 text-right transition-colors hover:bg-surface-container-low">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="font-label-code text-[11px] uppercase tracking-[0.16em] text-outline">{t('next')}</span>
              <span className="font-grotesk truncate text-[17px] font-semibold text-on-surface group-hover:text-primary">{next.name}</span>
            </span>
            <SpearArrow direction="right" className="h-6 w-18 shrink-0 text-primary-container transition-[translate,filter] duration-300 group-hover:translate-x-1.5 group-hover:brightness-140 motion-reduce:transition-none" />
          </Link>
        </nav>

        <section aria-labelledby="others-title" className="mt-6 flex flex-col gap-4">
          <h2 id="others-title" className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-outline">{t('others')}</h2>
          <ul className="grid grid-cols-4 gap-3 lg:grid-cols-8">
            {CHARACTERS.map((other) => {
              const current = other.id === character.id;
              return (
                <li key={other.id}>
                  <Link
                    href={`/characters/${other.id}`}
                    aria-label={other.name}
                    aria-current={current ? 'page' : undefined}
                    className={`group block p-px transition-transform duration-200 hover:-translate-y-1 ${current ? 'bg-primary-container' : 'bg-surface-container-high'}`}
                  >
                    <span className="relative block h-[170px] overflow-hidden bg-linear-to-b from-surface-container-low to-surface">
                      <Image
                        src={`/images/characters/${other.id}.webp`}
                        alt=""
                        width={904}
                        height={1270}
                        unoptimized
                        style={{ ...faceFrame(other.face, MINI_FACE_Y, MINI_WIDTH), transformOrigin: `${other.face.x * 100}% ${other.face.y * 100}%` }}
                        className={`absolute h-auto max-w-none transition-transform duration-300 group-hover:scale-105 ${current ? '' : 'brightness-75 grayscale-[0.7]'}`}
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
