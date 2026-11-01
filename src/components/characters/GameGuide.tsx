import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { CSSProperties, ReactNode } from 'react';
import { faceCrop } from '@/components/shared/characterImages';
import { CHARACTERS, type CharacterId } from '@/components/shared/characters';
import { ENERGY_MAX } from '@/game/energy';
import EnergyDemo from './EnergyDemo';

/** Énergie minimale pour déployer une extension du territoire, et durée pendant laquelle la technique est ensuite bloquée. */
const DOMAIN_MIN_ENERGY = 1000;
const DOMAIN_LOCK_SECONDS = 10;

const RUNNER_SIZE = 36;

/** Coureurs de la démonstration de frappe et la fraction de piste qu'ils atteignent. */
const RUNNERS: { id: CharacterId; finish: number; ring: string }[] = [
  { id: 'yuji', finish: 1, ring: 'ring-primary-container' },
  { id: 'megumi', finish: 0.86, ring: 'ring-secondary-container' },
  { id: 'yuta', finish: 0.72, ring: 'ring-surface-container-highest' },
];

/** Course de l'étape 3 : un exorciste par couloir (du 1er au 5e) et sa position sur la piste. */
const LANE_GAP = 56;
const RACE: { id: CharacterId; x: number }[] = [
  { id: 'gojo', x: 0.9 },
  { id: 'yuta', x: 0.8 },
  { id: 'maki', x: 0.71 },
  { id: 'megumi', x: 0.44 },
  { id: 'yuji', x: 0.27 },
];
/** Techniques lancées : couloir du lanceur → couloir du meneur visé, décalées d'une demi-boucle. */
const CASTS = [
  { from: 4, to: 0, delay: '0s' },
  { from: 3, to: 2, delay: '-2s' },
];
const laneY = (lane: number) => lane * LANE_GAP + RUNNER_SIZE / 2;

/** Éclair d'impact façon Black Flash : quelques branches brisées autour du point touché. */
const SPARK_PATH = 'M0 0 L5 -3 L3 -9 L10 -14 L9 -21 M0 0 L6 2 L11 -1 L18 3 L25 1 M0 0 L-4 4 L-2 10 L-9 15 L-10 22 M0 0 L-6 -2 L-10 -8 L-17 -9 M0 0 L2 6 L8 9 L9 17';

const DOMAIN_RINGS = [90, 170, 250, 340, 450];
const RESTRICTION_RINGS = [220, 420, 640, 880];

const face = (id: CharacterId) => CHARACTERS.find((c) => c.id === id)!.face;

// Guide de /characters : déroulé d'une course en cinq étapes animées (frappe, énergie, techniques,
// extension du territoire, restriction céleste), puis les règles communes.
export default function GameGuide() {
  const t = useTranslations('Guide');
  const sample = t('type.sample');

  return (
    <section aria-labelledby="guide-title" className="torn-top relative overflow-hidden bg-surface px-6 pt-[150px] pb-[170px]">
      <p aria-hidden="true" className="text-stroke-ghost pointer-events-none absolute top-[70px] -right-3.5 hidden whitespace-nowrap text-[190px] uppercase leading-none lg:block">
        {t('watermark')}
      </p>

      <div className="relative mx-auto flex max-w-[1152px] flex-col gap-28 lg:gap-[140px]">
        <div className="flex max-w-[720px] flex-col gap-3.5">
          <p className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary-container">{t('eyebrow')}</p>
          <h2 id="guide-title" className="text-[clamp(36px,5vw,64px)] leading-[1.1] uppercase tracking-[0.06em]">
            {t('titleLine1')}
            <br />
            <span className="text-primary">{t('titleLine2')}</span>
          </h2>
          <p className="text-[19px] leading-[30px] text-on-surface-variant">{t('intro')}</p>
        </div>

        <Step number="01" stroke="[-webkit-text-stroke:1px_rgb(225_29_72/0.45)]" title={t('type.title')} text={t('type.text')}>
          <div aria-hidden="true" className="font-label-code relative overflow-hidden text-[clamp(15px,1.8vw,20px)] leading-8 whitespace-nowrap">
            <span className="font-label-code text-outline-variant">{sample}</span>
            <span className="font-label-code guide-typed absolute top-0 left-0 overflow-hidden border-r-2 border-primary-container text-on-primary-container" style={{ '--chars': sample.length } as CSSProperties}>
              {sample}
            </span>
          </div>
          <div aria-hidden="true" className="flex flex-col gap-3.5">
            {RUNNERS.map(({ id, finish, ring }) => (
              <div key={id} className="relative h-9 border-b border-dashed border-surface-container-high">
                <span className={`guide-runner absolute top-0 size-9 overflow-hidden rounded-[50%] bg-surface-container-low ring-2 ${ring}`} style={{ '--finish': finish } as CSSProperties}>
                  <Portrait id={id} size={RUNNER_SIZE} />
                </span>
              </div>
            ))}
          </div>
        </Step>

        <Step number="02" flip stroke="[-webkit-text-stroke:1px_rgb(76_215_246/0.45)]" title={t('charge.title')} text={t('charge.text', { max: ENERGY_MAX })}>
          <EnergyDemo />
        </Step>

        <Step number="03" stroke="[-webkit-text-stroke:1px_rgb(192_193_255/0.45)]" title={t('catchUp.title')} text={t('catchUp.text')}>
          <RaceDemo />
        </Step>

        <Step
          number="04"
          flip
          flush
          stroke="[-webkit-text-stroke:1px_rgb(225_29_72/0.55)]"
          eyebrow={t('domain.eyebrow')}
          title={t('domain.title')}
          text={t('domain.text', { min: DOMAIN_MIN_ENERGY, seconds: DOMAIN_LOCK_SECONDS })}
        >
          <DomainDemo example={t('domain.example')} />
        </Step>

        <Step number="05" flush stroke="[-webkit-text-stroke:1px_rgb(229_189_190/0.45)]" eyebrow={t('restriction.eyebrow')} title={t('restriction.title')} text={t('restriction.text')}>
          <RestrictionDemo immune={t('restriction.immune')} />
        </Step>

        <ul className="flex flex-wrap gap-x-8 gap-y-3.5">
          {(['host', 'finish', 'bots'] as const).map((rule) => (
            <li key={rule} className="flex items-center gap-2.5 text-base text-on-surface-variant">
              <span aria-hidden="true" className="material-symbols-outlined text-xl text-primary">{RULE_ICONS[rule]}</span>
              {t(`rules.${rule}`)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const RULE_ICONS = { host: 'toggle_on', finish: 'flag', bots: 'smart_toy' } as const;

// Visage d'un personnage, cadré dans un rond de `size` px.
function Portrait({ id, size }: { id: CharacterId; size: number }) {
  return <Image src={`/images/characters/${id}.webp`} alt="" width={904} height={1270} unoptimized style={faceCrop(face(id), size)} className="absolute h-auto max-w-none" />;
}

// Étape 3 : cinq couloirs ; deux poursuivants lancent leur technique et le meneur visé encaisse un éclair.
function RaceDemo() {
  const targets = new Map(CASTS.map((cast) => [cast.to, cast.delay]));
  return (
    <div aria-hidden="true" className="relative h-[262px]">
      {RACE.map(({ id }, lane) => (
        <span key={id} className={`font-label-code absolute left-0 flex h-9 w-[34px] items-center text-[13px] ${lane < 3 ? 'text-primary' : 'text-outline'}`} style={{ top: lane * LANE_GAP }}>
          {String(lane + 1).padStart(2, '0')}
        </span>
      ))}
      <div className="absolute inset-y-0 right-[22px] left-11">
        {RACE.map(({ id }, lane) => (
          <div key={id} className="absolute inset-x-0 h-9 border-b border-dashed border-surface-container-high" style={{ top: lane * LANE_GAP }} />
        ))}
        {RACE.map(({ id, x }, lane) => (
          <span
            key={id}
            className={`absolute -mt-[18px] -ml-[18px] size-9 overflow-hidden rounded-[50%] bg-surface-container-low ring-2 ${lane < 3 ? 'ring-primary-container' : 'ring-secondary-container'} ${targets.has(lane) ? 'guide-racer' : ''}`}
            style={{ left: `${x * 100}%`, top: laneY(lane), animationDelay: targets.get(lane) }}
          >
            <Portrait id={id} size={RUNNER_SIZE} />
          </span>
        ))}
        {CASTS.map(({ from, to, delay }) => {
          const start = { x: `${RACE[from].x * 100}%`, y: `${laneY(from)}px` };
          const end = { x: `${RACE[to].x * 100}%`, y: `${laneY(to)}px` };
          return (
            <span key={`${from}-${to}`}>
              <span className="guide-charge absolute -mt-[26px] -ml-[26px] size-[52px] rounded-[50%] border-2 border-primary-container/80" style={{ left: start.x, top: start.y, animationDelay: delay }} />
              <span
                className="guide-cast absolute -mt-[5px] -ml-[5px] size-2.5 rounded-[50%] bg-on-primary-container"
                style={{ '--x1': start.x, '--y1': start.y, '--x2': end.x, '--y2': end.y, animationDelay: delay } as CSSProperties}
              />
              <svg viewBox="-32 -32 64 64" className="guide-spark absolute -mt-8 -ml-8 size-16" style={{ left: end.x, top: end.y, animationDelay: `${delay}, ${delay}` }}>
                <g fill="none" strokeLinejoin="round" strokeLinecap="round">
                  <path d={SPARK_PATH} stroke="#e11d48" strokeWidth={6} opacity={0.55} />
                  <path d={SPARK_PATH} stroke="#ff2d55" strokeWidth={3} />
                  <path d={SPARK_PATH} stroke="#050505" strokeWidth={1.2} />
                </g>
              </svg>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Étape 4 : le territoire s'ouvre en cercles depuis le centre, puis son sceau apparaît (exemple : celui de Gojo).
function DomainDemo({ example }: { example: string }) {
  return (
    <div aria-hidden="true" className="relative h-80 overflow-hidden bg-[radial-gradient(circle_at_50%_50%,#2a0010,#0e0e10_70%)]">
      <div className="guide-dom-fill absolute top-1/2 left-1/2 -mt-[260px] -ml-[260px] size-[520px] rounded-[50%] bg-[radial-gradient(circle,rgb(147_0_10/0.55),rgb(14_14_16/0)_70%)]" />
      {DOMAIN_RINGS.map((size, index) => (
        <span key={size} className="guide-dom-ring absolute top-1/2 left-1/2 rounded-[50%] border border-primary-container/75" style={{ width: size, height: size, animationDelay: `${index * 0.12}s` }} />
      ))}
      <div className="guide-dom-sigil absolute top-1/2 left-1/2 -mt-[125px] -ml-[125px] size-[250px] rounded-[50%] border-2 border-dashed border-primary/40" />
      <div className="guide-dom-word absolute inset-0 flex flex-col items-center justify-center gap-2.5">
        <span lang="ja" className="text-[44px] font-extrabold text-on-primary-container [text-shadow:0_0_18px_rgb(225_29_72/0.8)]">領域展開</span>
        <span lang="ja" className="text-lg font-bold text-primary">無量空処</span>
        <span className="font-label-code text-[11px] uppercase tracking-[0.2em] text-outline">{example}</span>
      </div>
      <div className="guide-dom-flash absolute inset-0 bg-on-primary-container" />
    </div>
  );
}

// Étape 5 : un territoire adverse déferle depuis la gauche, mais s'arrête net autour de Maki (restriction céleste).
function RestrictionDemo({ immune }: { immune: string }) {
  return (
    <div aria-hidden="true" className="relative h-[300px] overflow-hidden bg-surface-container-lowest">
      <div className="guide-hr-domain absolute inset-0">
        <div className="guide-hr-wave absolute top-1/2 -left-[530px] -mt-[500px] size-[1000px] rounded-[50%] bg-[radial-gradient(circle,rgb(147_0_10/0.6),rgb(147_0_10/0.35)_45%,rgb(14_14_16/0)_70%)]" />
        {RESTRICTION_RINGS.map((size, index) => (
          <span key={size} className="guide-hr-ring absolute top-1/2 -left-[30px] rounded-[50%] border border-primary-container/75" style={{ width: size, height: size, animationDelay: `${index * 0.12}s` }} />
        ))}
      </div>
      <div className="guide-hr-guard absolute top-1/2 left-[64%] -mt-[60px] -ml-[60px] size-[120px] rounded-[50%] border border-dashed border-on-surface/50" />
      <span className="absolute top-1/2 left-[64%] -mt-[38px] -ml-[38px] size-[76px] overflow-hidden rounded-[50%] bg-surface-container-low ring-2 ring-on-surface">
        <Portrait id="maki" size={76} />
      </span>
      <span className="font-label-code guide-hr-tag absolute top-[calc(50%+70px)] left-[64%] -translate-x-1/2 text-[11px] whitespace-nowrap uppercase tracking-[0.2em] text-on-primary-container">{immune}</span>
    </div>
  );
}

// Une étape du guide : texte d'un côté, démonstration animée dans un cadre rouge de l'autre (`flip` les inverse sur grand écran).
// `flush` : la démonstration remplit le cadre, sans marge intérieure.
function Step({ number, stroke, eyebrow, title, text, flip = false, flush = false, children }: { number: string; stroke: string; eyebrow?: string; title: string; text: string; flip?: boolean; flush?: boolean; children: ReactNode }) {
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-[88px]">
      <div className={`relative flex flex-col gap-4 ${flip ? 'lg:order-2' : ''}`}>
        <span aria-hidden="true" className={`font-grotesk absolute -top-[78px] -left-2.5 text-[140px] leading-none font-bold text-transparent ${stroke}`}>
          {number}
        </span>
        {eyebrow && <p className="font-label-code relative text-[12px] font-bold uppercase tracking-[0.32em] text-primary-container">{eyebrow}</p>}
        <h3 className="font-grotesk relative text-[32px] leading-[1.15] font-semibold">{title}</h3>
        <p className="relative text-lg leading-[29px] text-on-surface-variant">{text}</p>
      </div>
      <div className="bevel bg-primary-container p-px">
        <div className={`bevel flex flex-col gap-7 bg-surface-container-lowest ${flush ? '' : 'px-6 py-8 sm:px-8 sm:py-9'}`}>{children}</div>
      </div>
    </div>
  );
}
