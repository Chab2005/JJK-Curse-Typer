import { useTranslations } from 'next-intl';
import type { CSSProperties, ReactNode } from 'react';
import type { CharacterId } from '@/components/shared/characters';
import { BINDING_VOW_PROGRESS, DOMAIN_LOCK_SECONDS, DOMAIN_MIN_ENERGY, DOMAIN_SECONDS, type Ability } from '@/game/abilities';
import { ENERGY_MAX } from '@/game/energy';
import { spriteStyle } from './characterSprites';
import ControlsIntro from './ControlsIntro';
import EnergyDemo from './EnergyDemo';
import GojoDomain, { DomainScene } from './GojoDomain';
import Shortcut from './Shortcut';
import styles from './GameGuide.module.css';

/** Part de la course offerte par le pacte contraignant, en pourcentage. */
const VOW_PERCENT = Math.round(BINDING_VOW_PROGRESS * 100);

/** Raccourcis listés dans le bloc « Commandes », dans l'ordre des touches. */
const CONTROLS: Ability[] = ['domain', 'technique', 'vow'];

/** Échelles des bandes de sprites : coureurs de l'étape 1, couloirs de l'étape 3 et Maki, coureur des règles. */
const RUNNER_SCALE = 0.17;
const RACER_SCALE = 0.197;
const FINISH_SCALE = 0.12;

/** Coureurs de la démonstration de frappe et la fraction de piste qu'ils atteignent. */
const RUNNERS: { id: CharacterId; finish: number }[] = [
  { id: 'yuji', finish: 1 },
  { id: 'megumi', finish: 0.86 },
  { id: 'yuta', finish: 0.72 },
];

/** Course de l'étape 3 : le meneur (touché), un poursuivant et le lanceur, chacun dans son couloir et à sa place sur la piste. */
const LANE_GAP = 64;
const LANE_HEIGHT = 60;
const RACE: { id: CharacterId; x: number }[] = [
  { id: 'gojo', x: 0.84 },
  { id: 'maki', x: 0.56 },
  { id: 'yuji', x: 0.24 },
];
/** La technique part du dernier couloir et frappe le meneur. */
const CAST = { from: 2, to: 0 };
const laneCenter = (lane: number) => lane * LANE_GAP + LANE_HEIGHT / 2;

/** Black Flash de Yuji, bande de 16 images de 96 px (même fichier que la capacité « Black Flash »). */
const BLACK_FLASH = '/images/characters/anim/techniques/yuji/black-flash.png';
const BLACK_FLASH_FRAMES = 16;
const BLACK_FLASH_SHEET = 96 * BLACK_FLASH_FRAMES;

/** Barre cramoisie au bas des trois cartes, dans le dégradé du bouton « Jouer ». */
const CARD_BAR = 'pointer-events-none absolute inset-x-0 bottom-0 h-1.5 bg-linear-to-b from-primary-container via-[#a3102f] to-[#6e0718]';

type Tag = { label: string; tone?: 'energy' | 'hot' | 'light' };

// Guide de /characters (canvas « Personnages · guide repensé ») : la frappe qui charge l'énergie dans un grand panneau,
// puis trois cartes (technique, extension du territoire, restriction céleste) et les règles communes.
export default function GameGuide() {
  const t = useTranslations('Guide');
  const sample = t('type.sample');

  return (
    <section aria-labelledby="guide-title" className="torn-top relative overflow-hidden bg-surface px-6 pt-[130px] pb-[140px]">
      <p aria-hidden="true" className="text-stroke-ghost pointer-events-none absolute top-[60px] right-[max(24px,calc((100%-1152px)/2))] hidden whitespace-nowrap text-[190px] uppercase leading-none lg:block">
        {t('watermark')}
      </p>

      <div className="relative mx-auto flex max-w-[1152px] flex-col gap-12">
        <div className="flex max-w-[720px] flex-col gap-3.5">
          <p className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary-text">{t('eyebrow')}</p>
          <h2 id="guide-title" className="text-[clamp(36px,5vw,64px)] leading-[1.1] uppercase tracking-[0.06em]">
            {t('titleLine1')}
            <br />
            <span className="text-primary">{t('titleLine2')}</span>
          </h2>
          <p className="text-[19px] leading-[30px] text-on-surface-variant">{t('intro')}</p>
        </div>

        {/* 01 + 02 : double filet, la frappe à gauche, l'énergie qu'elle charge à droite. */}
        <DoubleFilet>
          <div className="grid gap-8 p-7 sm:p-11 lg:grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)]">
            <div className="flex flex-col gap-6">
              <Caption number="01" stroke="[-webkit-text-stroke:1px_rgb(225_29_72/0.55)]" title={t('type.title')} text={t('type.text')} />
              <div aria-hidden="true" className="font-label-code relative overflow-hidden text-[18px] leading-[30px] whitespace-nowrap">
                <span className="font-label-code text-outline-variant">{sample}</span>
                <span className="font-label-code guide-typed absolute top-0 left-0 overflow-hidden border-r-2 border-primary-container text-on-primary-container" style={{ '--chars': sample.length } as CSSProperties}>
                  {sample}
                </span>
              </div>
              <div aria-hidden="true" className="flex flex-col gap-1.5">
                {RUNNERS.map(({ id, finish }) => (
                  <div key={id} className="relative h-14 border-b border-dashed border-surface-container-high">
                    <span className="guide-runner absolute top-0 flex size-14 items-end justify-center" style={{ '--finish': finish } as CSSProperties}>
                      <Sprite id={id} kind="running" scale={RUNNER_SCALE} />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div aria-hidden="true" className="relative min-h-12">
              <span className={styles.stepDivider} />
            </div>

            <div className="flex flex-col gap-[22px]">
              <Caption number="02" stroke="[-webkit-text-stroke:1px_rgb(76_215_246/0.55)]" title={t('charge.title')} text={t('charge.text')} />
              <div className="flex flex-col gap-3">
                <EnergyDemo>
                  <p className="font-label-code relative h-4 text-[10px] uppercase tracking-[0.14em]">
                    <span aria-hidden="true" className="absolute -top-1.5 left-2/3 h-1.5 w-px bg-primary" />
                    <span className="font-label-code absolute left-2/3 -translate-x-1/2 whitespace-nowrap text-primary">{t('charge.marker', { min: DOMAIN_MIN_ENERGY })}</span>
                  </p>
                </EnergyDemo>
              </div>
              <TagList
                tags={[
                  { label: t('tags.max', { max: ENERGY_MAX }), tone: 'energy' },
                  { label: t('tags.streak') },
                ]}
              />
            </div>
          </div>
        </DoubleFilet>

        {/* 03, 04, 05 : trois cadres des cartes personnage, chacun terminé par la barre cramoisie. */}
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="bevel-var flex bg-primary-container p-px [--b:14px]">
            <article className="bevel-var relative flex flex-1 flex-col bg-linear-to-b from-surface-container-lowest from-55% to-[#2a0710] [--b:13.5px]">
              <RaceDemo />
              <CardBody number="03" stroke="[-webkit-text-stroke:1px_rgb(192_193_255/0.55)]" eyebrow={t('catchUp.eyebrow')} title={t('catchUp.title')} text={t('catchUp.text')}>
                <TagList stacked tags={[{ label: t('tags.top3') }, { label: t('tags.behind') }, { label: t('tags.leaders') }]} />
              </CardBody>
              <span aria-hidden="true" className={CARD_BAR} />
            </article>
          </div>

          <div className="cut-asym flex bg-[linear-gradient(160deg,#e11d48,#3a0c14_45%,#8f1022)] p-[2px] [--b:30px]">
            <article className="cut-asym relative flex flex-1 flex-col bg-surface-container-lowest [--b:29px]">
              <GojoDomain />
              <CardBody number="04" stroke="[-webkit-text-stroke:1px_rgb(225_29_72/0.6)]" eyebrow={t('domain.eyebrow')} title={t('domain.title')} text={t('domain.text')}>
                <TagList
                  stacked
                  tags={[
                    { label: t('tags.domainMin', { min: DOMAIN_MIN_ENERGY }), tone: 'hot' },
                    { label: t('tags.duration', { seconds: DOMAIN_SECONDS }) },
                    { label: t('tags.drain') },
                    { label: t('tags.lock', { seconds: DOMAIN_LOCK_SECONDS }) },
                  ]}
                />
              </CardBody>
              <span aria-hidden="true" className={CARD_BAR} />
            </article>
          </div>

          <DoubleFilet className="flex" faceClassName="relative flex flex-1 flex-col bg-surface-container-lowest">
            <DomainScene>
              <span className="guide-shield" />
              <span className="absolute top-[calc(50%+34px)] left-1/2 -translate-x-1/2 -translate-y-full">
                <Sprite id="maki" kind="running" scale={RACER_SCALE} />
              </span>
              <span className="guide-ground" />
              <span className="font-label-code absolute top-[calc(50%+66px)] left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap uppercase tracking-[0.2em] text-on-primary-container">
                {t('restriction.immune')}
              </span>
            </DomainScene>
            <CardBody number="05" stroke="[-webkit-text-stroke:1px_rgb(229_189_190/0.5)]" eyebrow={t('restriction.eyebrow')} title={t('restriction.title')} text={t('restriction.text')}>
              <TagList stacked angle={-4} tags={[{ label: t('tags.none') }, { label: t('tags.noCe') }, { label: t('tags.immune'), tone: 'light' }]} />
            </CardBody>
            <span aria-hidden="true" className={CARD_BAR} />
          </DoubleFilet>
        </div>

        <div className="flex flex-col gap-[18px]">
          <p className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary-text">{t('rulesTitle')}</p>
          <ul className="grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-4">
            <RuleCard title={t('rules.host.title')} text={t('rules.host.text')}>
              <span className="guide-switch hx-cut relative h-[30px] w-[62px] shrink-0 transition-colors duration-300 [--h:10px]">
                <span className="guide-switch-knob bevel-var absolute top-[5px] size-5 transition-[left,background-color] duration-300 [--b:5px] motion-reduce:transition-none" />
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="font-label-code text-[11px] uppercase tracking-[0.18em] text-outline">{t('rules.techniques')}</span>
                <span className="font-label-code text-[11px] uppercase tracking-[0.14em]">
                  <span className="font-label-code text-outline group-hover:hidden">{t('rules.off')}</span>
                  <span className="font-label-code hidden text-primary group-hover:inline">{t('rules.on')}</span>
                </span>
              </span>
            </RuleCard>
            <RuleCard title={t('rules.finish.title')} text={t('rules.finish.text')}>
              <span className="relative h-11 flex-1 border-b border-dashed border-on-surface/35">
                <span className="guide-finish-runner absolute bottom-0">
                  <Sprite id="yuji" kind="running" scale={FINISH_SCALE} />
                </span>
                <span className="absolute right-0 bottom-0 h-11 w-3 bg-[repeating-conic-gradient(#fffaf9_0_25%,#0e0e10_0_50%)] [background-size:6px_6px]" />
              </span>
            </RuleCard>
            <RuleCard title={t('rules.bots.title')} text={t('rules.bots.text')}>
              <span className="material-symbols-outlined guide-bob text-[30px] text-on-surface-variant transition-colors group-hover:text-on-primary-container">person</span>
              <span className="font-grotesk text-[26px] font-bold text-outline-variant transition-[color,text-shadow] group-hover:text-primary group-hover:[text-shadow:0_0_12px_rgb(225_29_72/0.8)]">=</span>
              <span className="material-symbols-outlined guide-bob text-[30px] text-on-surface-variant transition-colors [animation-delay:-0.3s] group-hover:text-on-primary-container">smart_toy</span>
              <span className="font-label-code ml-auto text-[10px] uppercase tracking-[0.18em] text-outline">{t('rules.same')}</span>
            </RuleCard>
            <RuleCard title={t('rules.vow.title')} text={t('rules.vow.text', { percent: VOW_PERCENT })}>
              <span className="relative h-2 flex-1 bg-surface-container-high">
                <span className="absolute inset-y-0 left-0 w-[15%] bg-outline-variant" />
                <span className="absolute inset-y-0 left-[15%] w-0 bg-primary transition-[width] duration-500 group-hover:w-[30%] motion-reduce:transition-none" />
              </span>
              <span className="font-label-code text-[12px] text-outline transition-colors group-hover:text-primary">{t('rules.vow.gain', { percent: VOW_PERCENT })}</span>
            </RuleCard>
          </ul>
        </div>

        <section aria-labelledby="controls-title" className="flex flex-col gap-[18px]">
          <p id="controls-title" className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary-text">{t('controls.title')}</p>
          <ControlsIntro />
          <ul className="grid gap-3 md:grid-cols-3">
            {CONTROLS.map((ability) => (
              <FiletCard key={ability} faceClassName="items-center gap-4 px-5 py-4">
                <Shortcut ability={ability} />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-grotesk text-[17px] font-semibold text-on-primary-container">{t(`controls.${ability}.label`)}</span>
                  <span className="text-sm text-on-surface-variant">{t(`controls.${ability}.hint`)}</span>
                </span>
              </FiletCard>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}

// Personnage en pixel art qui joue sa bande idle ou de course, à `scale` de la taille du fichier.
function Sprite({ id, kind, scale }: { id: CharacterId; kind: 'idle' | 'running'; scale: number }) {
  return <span className="block motion-reduce:[animation:none]!" style={spriteStyle(id, kind, scale)} />;
}

// Cadre à double filet des cartes personnage : cadre, vide, filet et face, chaque couche un peu moins biseautée.
function DoubleFilet({ className = '', faceClassName = 'bg-[radial-gradient(120%_120%_at_50%_0%,#1c0709_0%,#0e0e10_60%)]', children }: { className?: string; faceClassName?: string; children: ReactNode }) {
  return (
    <div className={`bevel-var bg-[#8f1022] p-px [--b:14px] ${className}`}>
      <div className="bevel-var flex flex-1 bg-[#0b0405] p-[3px] [--b:13.5px]">
        <div className="bevel-var flex flex-1 bg-primary-container/40 p-px [--b:12px]">
          <div className={`bevel-var flex-1 [--b:11.5px] ${faceClassName}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}

// Numéro en contour, sur-titre facultatif, titre et texte d'une étape.
function Caption({ number, stroke, eyebrow, title, text }: { number: string; stroke: string; eyebrow?: string; title: string; text: string }) {
  return (
    <div className="flex items-start gap-[18px]">
      <span aria-hidden="true" className={`font-grotesk text-[64px] leading-[0.8] font-bold text-transparent ${stroke}`}>{number}</span>
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow && <p className="font-label-code text-[11px] font-bold uppercase tracking-[0.28em] text-primary-text">{eyebrow}</p>}
        <h3 className="font-grotesk text-2xl leading-[1.2] font-semibold">{title}</h3>
        <p className="text-base leading-[25px] text-on-surface-variant">{text}</p>
      </div>
    </div>
  );
}

function CardBody({ children, ...caption }: { number: string; stroke: string; eyebrow: string; title: string; text: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col gap-[18px] px-[26px] pt-[26px] pb-[34px]">
      <Caption {...caption} />
      {children}
    </div>
  );
}

// Étiquettes à double filet : en ligne, ou empilées et inclinées (le début plus bas que la fin) dans les cartes.
function TagList({ tags, stacked = false, angle = -7 }: { tags: Tag[]; stacked?: boolean; angle?: number }) {
  return (
    <ul className={stacked ? 'flex flex-col items-start gap-3.5 pt-1.5 pb-2.5' : 'flex flex-wrap gap-2.5'}>
      {tags.map(({ label, tone }) => (
        <li key={label} className={`tag ${tone ? `tag-${tone}` : ''} origin-left`} style={stacked ? { rotate: `${angle}deg` } : undefined}>
          <span>
            <span>
              <span className="font-label-code">{label}</span>
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// Étape 3 : trois couloirs ; le dernier lance sa technique et le meneur encaisse un éclair.
function RaceDemo() {
  const start = { x: `${RACE[CAST.from].x * 100}%`, y: `${laneCenter(CAST.from)}px` };
  const end = { x: `${RACE[CAST.to].x * 100}%`, y: `${laneCenter(CAST.to)}px` };

  return (
    <div aria-hidden="true" className="relative h-[220px] overflow-hidden bg-[radial-gradient(ellipse_80%_70%_at_70%_20%,rgb(147_0_10/0.25),#0b0b0d_70%)]">
      <div className="absolute inset-x-[22px] inset-y-4">
        {RACE.map(({ id }, lane) => (
          <div key={id} className={`absolute inset-x-0 border-b border-dashed ${lane === CAST.to ? 'border-primary-container/45' : 'border-surface-container-high'}`} style={{ top: lane * LANE_GAP, height: LANE_HEIGHT }} />
        ))}
        {RACE.map(({ id, x }, lane) => (
          <span key={id} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${x * 100}%`, top: lane * LANE_GAP + LANE_HEIGHT }}>
            <span className={`block ${lane === CAST.to ? 'guide-racer' : ''}`}>
              <Sprite id={id} kind="running" scale={RACER_SCALE} />
            </span>
          </span>
        ))}
        <span
          className="guide-cast absolute -mt-[5px] -ml-[5px] size-2.5 rounded-[50%] bg-on-primary-container"
          style={{ '--x1': start.x, '--y1': start.y, '--x2': end.x, '--y2': end.y } as CSSProperties}
        />
        {/* Black Flash de Yuji (bande de 16 images de 96 px) centrée sur le point touché. */}
        <span className="guide-spark absolute -mt-12 -ml-12 block size-24" style={{ left: end.x, top: end.y }}>
          <span
            className="block size-full [image-rendering:pixelated] motion-reduce:hidden"
            style={{ background: `url(${BLACK_FLASH}) 0 0 / ${BLACK_FLASH_SHEET}px 96px no-repeat`, animation: `sprite-idle ${BLACK_FLASH_FRAMES * 80}ms steps(${BLACK_FLASH_FRAMES}) infinite`, '--sprite-end': `-${BLACK_FLASH_SHEET}px` } as CSSProperties}
          />
        </span>
      </div>
    </div>
  );
}

// Règle commune : carte à double filet, avec sa petite animation en tête.
function RuleCard({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <FiletCard faceClassName="flex-col gap-3 px-6 pt-[22px] pb-[26px]">
      <div aria-hidden="true" className="relative mb-1.5 flex h-16 items-center gap-3.5 border-b border-dashed border-[#2a1416] px-1">{children}</div>
      <h3 className="font-grotesk text-xl font-semibold text-on-primary-container">{title}</h3>
      <p className="text-[15px] leading-[23px] text-on-surface-variant">{text}</p>
    </FiletCard>
  );
}

// Carte à double filet des règles et des commandes, qui monte et s'allume au survol.
function FiletCard({ faceClassName, children }: { faceClassName: string; children: ReactNode }) {
  return (
    <li className="group flex min-w-0 transition-[translate,filter] duration-250 hover:-translate-y-[5px] hover:drop-shadow-[0_0_14px_rgb(225_29_72/0.4)] motion-reduce:transition-none">
      <div className="bevel-var flex min-w-0 flex-1 bg-[#4a1218] p-px transition-colors duration-250 [--b:12px] group-hover:bg-primary-container">
        <div className="bevel-var flex min-w-0 flex-1 bg-[#0b0405] p-[3px] [--b:11.5px]">
          <div className="bevel-var flex min-w-0 flex-1 bg-primary-container/20 p-px transition-colors duration-250 [--b:10px] group-hover:bg-primary-container/55">
            <div className={`bevel-var flex min-w-0 flex-1 bg-[radial-gradient(120%_120%_at_50%_0%,#1f080c,#0c0304_70%)] [--b:9.5px] ${faceClassName}`}>{children}</div>
          </div>
        </div>
      </div>
    </li>
  );
}
