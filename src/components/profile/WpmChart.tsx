'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import BevelPanel from '@/components/shared/BevelPanel';
import Segmented from '@/components/shared/Segmented';
import { PERIODS, type Period, type RaceWpm, wpmHistory } from './wpmHistory';

const H = 240;
const PAD = { left: 40, right: 20, top: 18, bottom: 30 };
const PLOT_H = H - PAD.top - PAD.bottom;
/** Espace minimal entre deux dates de l'axe X, en pixels. */
const TICK_SPACING = 96;

// Évolution du MPM (STAT-2) : une ligne, réticule et infobulle au survol ou aux flèches du clavier.
export default function WpmChart({ races, now }: { races: RaceWpm[]; now: string }) {
  const t = useTranslations('Profile.chart');
  const format = useFormatter();
  const areaId = useId();
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

  const { granularity, points } = wpmHistory(races, period, new Date(now));
  const values = points.flatMap((p) => (p.wpm === null ? [] : [p.wpm]));
  const yMax = Math.max(20, Math.ceil(Math.max(0, ...values) / 20) * 20);
  const x = (i: number) => PAD.left + (points.length === 1 ? PLOT_W / 2 : (i / (points.length - 1)) * PLOT_W);
  const y = (wpm: number) => PAD.top + PLOT_H - (wpm / yMax) * PLOT_H;

  const label = (start: string) =>
    format.dateTime(new Date(start), granularity === 'day' ? { day: 'numeric', month: 'short', timeZone: 'UTC' } : { month: 'short', year: '2-digit', timeZone: 'UTC' });

  const defined = points.map((p, i) => ({ ...p, i })).filter((p) => p.wpm !== null);
  const path = defined.map((p, k) => `${k === 0 ? 'M' : 'L'}${x(p.i).toFixed(1)} ${y(p.wpm!).toFixed(1)}`).join('');
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
    <BevelPanel as="section" aria-labelledby="wpm-chart-title" className="flex flex-col gap-4 px-5 pt-6 pb-5 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="wpm-chart-title" className="flex items-center gap-2.5 text-[20px] uppercase tracking-[0.1em] text-on-surface">
          <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-primary-container">trending_up</span>
          {t('title')}
        </h2>
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
          aria-label={t('summary', { count: values.length, last: last?.wpm ?? 0 })}
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
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(yMax * f)} y2={y(yMax * f)} stroke={f === 0 ? '#5c2a2e' : '#3a1a1d'} strokeWidth={1} />
              <text x={PAD.left - 8} y={y(yMax * f) + 4} textAnchor="end" className="fill-outline font-label-code text-[11px]">{Math.round(yMax * f)}</text>
            </g>
          ))}
          {points.map((p, i) =>
            showTick(i) ? (
              <text key={p.start} x={x(i)} y={H - 8} textAnchor="middle" className="fill-outline font-label-code text-[11px]">{label(p.start)}</text>
            ) : null,
          )}

          {current && <line x1={x(active!)} x2={x(active!)} y1={PAD.top} y2={PAD.top + PLOT_H} stroke="#ac8889" strokeWidth={1} strokeDasharray="3 3" />}
          {area && <path d={area} fill={`url(#${areaId})`} />}
          <path d={path} fill="none" stroke="#e11d48" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" className="drop-shadow-[0_0_6px_rgb(225_29_72/0.7)]" />
          {defined.map((p) => (
            <circle key={p.start} cx={x(p.i)} cy={y(p.wpm!)} r={p.i === active ? 5.5 : 4} fill={p === last ? '#ffb3b6' : '#e11d48'} stroke="#0c0304" strokeWidth={2} />
          ))}
          {last && (
            <text x={x(last.i)} y={y(last.wpm!) - 12} textAnchor="end" className="fill-on-surface font-label-code text-[12px] font-bold">
              {t('wpm', { value: last.wpm! })}
            </text>
          )}
        </svg>

        {current && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 border border-[#8f1022] bg-[#0c0304] px-3 py-2 whitespace-nowrap shadow-[0_8px_16px_rgb(0_0_0/0.5)]"
            style={{ left: `${Math.min(88, Math.max(12, (x(active!) / W) * 100))}%` }}
          >
            <p className="font-grotesk text-[18px] font-bold text-on-surface">{current.wpm === null ? t('noRace') : t('wpm', { value: current.wpm })}</p>
            <p className="font-label-code text-[11px] text-on-surface-variant">
              {label(current.start)} · {t('races', { count: current.races })}
            </p>
          </div>
        )}
      </div>

      {values.length === 0 && <p className="text-center text-on-surface-variant">{t('empty')}</p>}

      <table className="sr-only">
        <thead>
          <tr>
            <th scope="col">{t('date')}</th>
            <th scope="col">{t('wpmColumn')}</th>
            <th scope="col">{t('racesColumn')}</th>
          </tr>
        </thead>
        <tbody>
          {defined.map((p) => (
            <tr key={p.start}>
              <td>{label(p.start)}</td>
              <td>{p.wpm}</td>
              <td>{p.races}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </BevelPanel>
  );
}
