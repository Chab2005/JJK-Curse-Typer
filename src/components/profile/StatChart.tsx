'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import BevelPanel from '@/components/shared/BevelPanel';
import FilterPopover from '@/components/shared/FilterPopover';
import PlateOption from '@/components/shared/PlateOption';
import Segmented from '@/components/shared/Segmented';
import { PERIODS, type Period, type RaceStat, STATS, type Stat, statAxis, statHistory } from './statHistory';

const H = 240;
const PAD = { left: 48, right: 20, top: 18, bottom: 30 };
const PLOT_H = H - PAD.top - PAD.bottom;
/** Espace minimal entre deux dates de l'axe X, en pixels. */
const TICK_SPACING = 96;

// Évolution d'une statistique (STAT-2), MPM par défaut, les autres au choix dans un panneau :
// une ligne, réticule et infobulle au survol ou aux flèches du clavier.
export default function StatChart({ races, now }: { races: RaceStat[]; now: string }) {
  const t = useTranslations('Profile.chart');
  const format = useFormatter();
  const areaId = useId();
  const [stat, setStat] = useState<Stat>('wpm');
  const [period, setPeriod] = useState<Period>('30d');
  const [active, setActive] = useState<number | null>(null);
  // Le SVG suit la largeur réelle du conteneur : les textes gardent leur taille en pixels sur téléphone.
  const frameRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => setW(Math.max(280, Math.round(entry.contentRect.width))));
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);
  const PLOT_W = W - PAD.left - PAD.right;

  const { granularity, points } = statHistory(races, stat, period, new Date(now));
  const values = points.flatMap((p) => (p.value === null ? [] : [p.value]));
  const played = points.filter((p) => p.races > 0).length;
  const axis = statAxis(stat, values);
  const x = (i: number) => PAD.left + (points.length === 1 ? PLOT_W / 2 : (i / (points.length - 1)) * PLOT_W);
  const y = (value: number) => PAD.top + PLOT_H - ((value - axis.min) / (axis.max - axis.min)) * PLOT_H;

  const label = (start: string) =>
    format.dateTime(new Date(start), granularity === 'day' ? { day: 'numeric', month: 'short', timeZone: 'UTC' } : { month: 'short', year: '2-digit', timeZone: 'UTC' });
  /** Valeur avec son unité, pour l'infobulle et la dernière valeur. */
  const formatValue = (value: number) => {
    switch (stat) {
      case 'wpm':
        return t('wpm', { value });
      case 'score':
        return t('score', { value: format.number(value) });
      case 'accuracy':
        return format.number(value, { style: 'percent', maximumFractionDigits: 1 });
      case 'races':
        return t('races', { count: value });
      case 'wins':
        return t('wins', { count: value });
      case 'errors':
        return t('errors', { value: format.number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });
    }
  };
  const formatTick = (value: number) =>
    stat === 'accuracy' ? format.number(value, { style: 'percent', maximumFractionDigits: 1 }) : format.number(value, { maximumFractionDigits: 1 });

  const defined = points.map((p, i) => ({ ...p, i })).filter((p) => p.value !== null);
  const path = defined.map((p, k) => `${k === 0 ? 'M' : 'L'}${x(p.i).toFixed(1)} ${y(p.value!).toFixed(1)}`).join('');
  const last = defined.at(-1);
  // Aire sous la ligne, fondue vers le bas, du premier au dernier point joué.
  const floor = (PAD.top + PLOT_H).toFixed(1);
  const area = last ? `${path}L${x(last.i).toFixed(1)} ${floor}L${x(defined[0].i).toFixed(1)} ${floor}Z` : '';
  const tickStep = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(PLOT_W / TICK_SPACING))));
  // Dates de l'axe X : une tous les `tickStep` points, plus la dernière, sans chevauchement avec elle.
  const showTick = (i: number) => i === points.length - 1 || (i % tickStep === 0 && points.length - 1 - i >= tickStep / 2);
  const current = active === null ? null : points[active];

  const pick = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - box.left) / box.width) * W;
    const i = Math.round(((svgX - PAD.left) / PLOT_W) * (points.length - 1));
    setActive(Math.min(points.length - 1, Math.max(0, i)));
  };
  const step = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const from = active ?? points.length - 1;
    setActive(Math.min(points.length - 1, Math.max(0, from + (e.key === 'ArrowRight' ? 1 : -1))));
  };

  return (
    <BevelPanel as="section" aria-label={t('title', { stat: t(`stats.${stat}`) })} className="flex flex-col gap-4 px-5 pt-6 pb-5 sm:px-8">
      {/* Statistique à gauche, périodes à droite, centrées sur la même ligne. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterPopover
          label={<ReserveText active={stat} text={(s) => t.rich('statCurrent', { stat: t(`stats.${s}`), prefix: (chunks) => <span className="max-sm:sr-only">{chunks}</span>, strong: (chunks) => <strong className="font-normal text-primary">{chunks}</strong> })} />}
          icon="query_stats"
          closeLabel={t('close')}
          portal
          footerAlign="end"
        >
          <fieldset className="flex flex-col gap-1.5">
            <legend className="font-label-code mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-text">{t('statLegend')}</legend>
            {STATS.map((s) => (
              <PlateOption
                key={s}
                type="radio"
                name="chart-stat"
                checked={s === stat}
                onChange={() => {
                  setStat(s);
                  setActive(null);
                }}
              >
                {t(`stats.${s}`)}
              </PlateOption>
            ))}
          </fieldset>
        </FilterPopover>
        <Segmented
          label={t('period')}
          options={PERIODS}
          value={period}
          onChange={(p) => {
            setPeriod(p);
            setActive(null);
          }}
          optionLabel={(p) => t(`periods.${p}`)}
        />
      </div>

      <div ref={frameRef} className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={t('summary', { stat: t(`stats.${stat}`), count: played, last: last ? formatValue(last.value!) : '—' })}
          tabIndex={0}
          onPointerMove={pick}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(points.length - 1)}
          onBlur={() => setActive(null)}
          onKeyDown={step}
          width={W}
          height={H}
          className="block max-w-full touch-none overflow-visible focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-tertiary"
        >
          <defs>
            <linearGradient id={areaId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#e11d48" stopOpacity="0.35" />
              <stop offset="1" stopColor="#e11d48" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grille et axe Y, en retrait */}
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const value = axis.min + (axis.max - axis.min) * f;
            return (
              <g key={f}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(value)} y2={y(value)} stroke={f === 0 ? '#5c2a2e' : '#3a1a1d'} strokeWidth={1} />
                <text x={PAD.left - 8} y={y(value) + 4} textAnchor="end" className="fill-outline font-label-code text-[11px]">{formatTick(value)}</text>
              </g>
            );
          })}
          {points.map((p, i) =>
            showTick(i) ? (
              <text key={p.start} x={x(i)} y={H - 8} textAnchor="middle" className="fill-outline font-label-code text-[11px]">{label(p.start)}</text>
            ) : null,
          )}

          {current && <line x1={x(active!)} x2={x(active!)} y1={PAD.top} y2={PAD.top + PLOT_H} stroke="#ac8889" strokeWidth={1} strokeDasharray="3 3" />}
          {area && <path d={area} fill={`url(#${areaId})`} />}
          <path d={path} fill="none" stroke="#e11d48" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" className="drop-shadow-[0_0_6px_rgb(225_29_72/0.7)]" />
          {defined.map((p) => (
            <circle key={p.start} cx={x(p.i)} cy={y(p.value!)} r={p.i === active ? 5.5 : 4} fill={p === last ? '#ffb3b6' : '#e11d48'} stroke="#0c0304" strokeWidth={2} />
          ))}
          {last && (
            <text x={x(last.i)} y={y(last.value!) - 12} textAnchor="end" className="fill-on-surface font-label-code text-[12px] font-bold">
              {formatValue(last.value!)}
            </text>
          )}
        </svg>

        {current && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 border border-[#8f1022] bg-[#0c0304] px-3 py-2 whitespace-nowrap shadow-[0_8px_16px_rgb(0_0_0/0.5)]"
            style={{ left: `${Math.min(88, Math.max(12, (x(active!) / W) * 100))}%` }}
          >
            <p className="font-grotesk text-[18px] font-bold text-on-surface">{current.value === null ? t('noRace') : formatValue(current.value)}</p>
            <p className="font-label-code text-[11px] text-on-surface-variant">
              {label(current.start)} · {t('races', { count: current.races })}
            </p>
          </div>
        )}
      </div>

      {played === 0 && <p className="text-center text-on-surface-variant">{t('empty')}</p>}

      <table className="sr-only">
        <thead>
          <tr>
            <th scope="col">{t('date')}</th>
            <th scope="col">{t(`stats.${stat}`)}</th>
            <th scope="col">{t('racesColumn')}</th>
          </tr>
        </thead>
        <tbody>
          {defined.map((p) => (
            <tr key={p.start}>
              <td>{label(p.start)}</td>
              <td>{formatValue(p.value!)}</td>
              <td>{p.races}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </BevelPanel>
  );
}

// Libellé du bouton du panneau : toutes les variantes superposées dans la même case,
// la plus large donne la taille, et changer de statistique ne déplace rien. En <span>, valide dans un titre ou un bouton.
function ReserveText({ active, text }: { active: Stat; text: (stat: Stat) => React.ReactNode }) {
  return (
    <span className="inline-grid">
      {STATS.map((s) => (
        <span key={s} aria-hidden={s === active ? undefined : true} className={`col-start-1 row-start-1 ${s === active ? '' : 'invisible'}`}>
          {text(s)}
        </span>
      ))}
    </span>
  );
}
