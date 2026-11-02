import type { CSSProperties } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import ChevronButton from '@/components/shared/ChevronButton';
import SpearArrow from '@/components/shared/SpearArrow';
import { Link } from '@/i18n/navigation';
import BevelFrame, { cardFrame } from '@/components/shared/BevelFrame';
import type { Character } from '@/components/shared/characters';
import { neighbours } from './characterPages';
import { CHARACTER_STYLES } from './characterStyles';
import { SPRITES, spriteBox } from './characterSprites';
import { DOMAIN_SECONDS } from '@/game/abilities';
import PixelDomain from './PixelDomain';
import Shortcut from './Shortcut';
import Abilities from './Abilities';

/** Ligne « Alt + touche, puis tapez le nom » sous une technique ou un territoire. */
const CAST_HINT = 'mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-dashed border-surface-container-high pt-3.5 text-sm text-on-surface-variant';

/** Flèche en lance des fiches voisines. */
const SPEAR = 'h-12 w-36 shrink-0 text-primary-container transition-[translate,filter] duration-300 group-hover:brightness-140 motion-reduce:transition-none lg:h-[70px] lg:w-[210px]';

// Fiche d'un personnage (/characters/<id>) : illustration en pied dans un cadre aux coins coupés, technique,
// extension du territoire, capacités de la technique, puis les fiches voisines.
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
          <div className="relative h-[600px] lg:h-[780px]" style={{ '--glow': style.glow } as CSSProperties}>
            <div aria-hidden="true" className="cut-asym-flip absolute inset-x-0 top-24 bottom-0 bg-linear-160 from-primary-container via-(--glow) via-60% to-surface-container-high p-px [--b:64px]">
              <div className={`cut-asym-flip relative h-full overflow-hidden [--b:64px] ${style.tint}`}>
                <span className="absolute inset-x-0 bottom-0 h-[46%] bg-[repeating-linear-gradient(-58deg,transparent_0_22px,rgb(4_4_13/0.55)_22px_23px)]" />
                <span className="absolute -inset-x-[10%] -bottom-15 h-45 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,#04040d_30%,transparent_72%)]" />
              </div>
            </div>
            <Image
              src={`/images/characters/${character.id}.webp`}
              alt={t('portraitAlt', { name: character.name })}
              width={904}
              height={1270}
              unoptimized
              priority
              className="absolute bottom-0 left-[46%] h-full w-auto max-w-none -translate-x-1/2 drop-shadow-[0_24px_30px_rgb(0_0_0/0.65)]"
            />
            <div aria-hidden="true" className="group/sprite absolute right-5 bottom-5 h-[150px] w-[128px] lg:right-[30px] lg:bottom-[26px]">
              <span className="absolute bottom-0 left-1/2 h-[30px] w-[150px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_35%,color-mix(in_srgb,var(--glow)_55%,transparent)_62%,transparent_72%)] shadow-[0_0_0_1px_rgb(192_193_255/0.25)]" />
              <div
                className="absolute right-6 bottom-3 [image-rendering:pixelated] group-hover/sprite:hidden"
                style={{ width: idle.width, height: idle.height, background: `url(/images/characters/anim/${character.id}-idle.png) 0 0 / ${idle.sheetWidth}px ${idle.height}px no-repeat`, animation: 'sprite-idle 0.9s steps(8) infinite', '--sprite-end': `-${idle.sheetWidth}px` } as CSSProperties}
              />
              <div
                className="absolute right-1 bottom-3 hidden [image-rendering:pixelated] group-hover/sprite:block"
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
              {character.id !== 'maki' && (
                <p className={CAST_HINT}>
                  <Shortcut ability="technique" />
                  <span>{t('castHint', { name: techniques(character.id) })}</span>
                </p>
              )}
            </BevelFrame>

            {(character.id === 'gojo' || character.id === 'megumi' || character.id === 'yuta' || character.id === 'sukuna') && (
              <BevelFrame frame={cardFrame} className="overflow-hidden bg-surface">
                <PixelDomain character={character.id} />
                <div className="flex flex-col gap-1.5 px-6 py-[18px]">
                  <p className="font-label-code text-[11px] font-bold uppercase tracking-[0.24em] text-outline">{t('domainTitle')}</p>
                  <h2 className={`text-xl ${style.ink}`}>{t(`domains.${character.id}`)}</h2>
                  <p className="text-base leading-[25px]">{t(`domainDetails.${character.id}`)}</p>
                  <p className={CAST_HINT}>
                    <Shortcut ability="domain" />
                    <span>{t('castHint', { name: t(`domains.${character.id}`) })}</span>
                    <span className="font-label-code ml-auto text-[11px] uppercase tracking-[0.16em] text-primary">{t('domainDuration', { seconds: DOMAIN_SECONDS })}</span>
                  </p>
                </div>
              </BevelFrame>
            )}

            <ChevronButton as={Link} href="/lobbies" frame="self-start" className="gap-2.5 text-sm uppercase tracking-[0.16em] whitespace-nowrap">
              {t('play', { name: character.name.split(' ')[0] })}
              <span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_forward</span>
            </ChevronButton>
          </div>
        </article>

        <Abilities character={character.id} />

        <nav aria-label={t('otherFiles')} className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <Link href={`/characters/${prev.id}`} aria-label={t('previous', { name: prev.name })} className="group flex min-h-14 items-center gap-3.5">
            <SpearArrow direction="left" className={`${SPEAR} group-hover:-translate-x-2`} />
            <span className="font-grotesk text-[17px] font-semibold whitespace-nowrap text-on-surface group-hover:text-primary">{prev.name}</span>
          </Link>
          <ChevronButton as={Link} href="/characters" className="gap-2.5 text-sm uppercase tracking-[0.16em] whitespace-nowrap">
            <span aria-hidden="true" className="material-symbols-outlined text-lg">grid_view</span>
            {t('all')}
          </ChevronButton>
          <Link href={`/characters/${next.id}`} aria-label={t('next', { name: next.name })} className="group ml-auto flex min-h-14 items-center gap-3.5">
            <span className="font-grotesk text-[17px] font-semibold whitespace-nowrap text-on-surface group-hover:text-primary">{next.name}</span>
            <SpearArrow direction="right" className={`${SPEAR} group-hover:translate-x-2`} />
          </Link>
        </nav>
      </div>
    </>
  );
}
