'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import BevelPanel from '@/components/shared/BevelPanel';
import BevelSelect from '@/components/shared/BevelSelect';
import type { ChartStat, SeriesEntry } from '@/game/series';
import type { SummaryRow } from './RaceSummary';
import { type ChartSize, type HoverPoint, availableStats, chartLines, nearestPoint } from './seriesChart';

const SIZE: ChartSize = { width: 720, height: 280, pad: { left: 48, right: 20, top: 16, bottom: 34 } };
/** Teintes assez distinctes pour 30 lignes : au-delà de dix, elles se répètent (traits pleins, puis pointillés pour les bots). */
const COLORS = ['#ff5577', '#e0b84c', '#4fd1a5', '#6aa6ff', '#c58bff', '#ff9a5a', '#7ee0e0', '#b0d65a', '#ff7fb0', '#9aa3b5'];
/** Opacité des lignes qui ne sont ni survolées ni épinglées. */
const DIMMED = 0.25;

/** Couleur de la ligne de chaque participant, dans l'ordre du classement ; celle du joueur est toujours la première teinte. */
export const lineColor = (index: number) => COLORS[index % COLORS.length];

/** Survol : le point lu et la position du curseur, en pourcentage de la boîte du graphique (pour placer l'infobulle). */
interface Hover {
  point: HoverPoint;
  at: { x: number; y: number };
}

// Participants seconde par seconde (RES-03), une ligne chacun sur des axes communs. Le titre est un menu : MPM net, MPM brut,
// précision, erreurs ou progression, selon ce que la course a enregistré. Survoler le graphique met en avant la ligne la plus
// proche et donne sa valeur à cette seconde près du curseur ; cliquer un nom de la légende épingle sa ligne, que le curseur
// suit alors partout. Infobulle et repères sont posés par-dessus : rien ne bouge autour.
export default function RaceSeriesChart({ series, rows }: { series: SeriesEntry[]; rows: SummaryRow[] }) {
  const t = useTranslations('Race.summary.chart');
  const format = useFormatter();
  const labelId = useId();
  const stats = availableStats(series);
  const [chosen, setChosen] = useState<ChartStat>('wpm');
  const stat = stats.includes(chosen) ? chosen : 'wpm';
  const [pinned, setPinned] = useState<string | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  const chart = chartLines(series, SIZE, stat);
  const { width, height, pad } = SIZE;
  const ordered = rows.filter((row) => chart.lines.some((line) => line.id === row.id));
  const colorOf = (id: string) => lineColor(Math.max(0, rows.filter((row) => series.some((entry) => entry.id === row.id)).findIndex((row) => row.id === id)));
  const nameOf = (id: string) => rows.find((row) => row.id === id)?.name ?? id;
  const active = hover?.point.id ?? pinned;
  // La ligne mise en avant passe au-dessus des autres.
  const lines = active ? [...chart.lines.filter((line) => line.id !== active), ...chart.lines.filter((line) => line.id === active)] : chart.lines;
  const statName = t(`stats.${stat}`);

  const valueText = (value: number) => {
    if (stat === 'accuracy' || stat === 'progress') return t(`units.${stat}`, { value: format.number(value / 100, { style: 'percent', maximumFractionDigits: 1 }) });
    return t(`units.${stat}`, { value });
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    const x = (e.clientX - box.left) / box.width;
    const y = (e.clientY - box.top) / box.height;
    const point = nearestPoint(chart, x * width, y * height, pinned ?? undefined);
    setHover(point ? { point, at: { x: x * 100, y: y * 100 } } : null);
  };

  const choose = (next: ChartStat) => {
    setChosen(next);
    setHover(null);
  };

  return (
    <BevelPanel as="section" aria-labelledby="race-chart-title" className="flex flex-col gap-5 px-5 pt-6 pb-7 sm:px-8">
      {/* Le menu tient la place du nom de la mesure ; le titre lu par un lecteur d'écran reste « MPM dans le temps ». */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-primary-text">show_chart</span>
        <span id={labelId} className="sr-only">{t('statLabel')}</span>
        <BevelSelect labelId={labelId} options={stats} value={stat} onChange={choose} optionLabel={(option) => t(`stats.${option}`)} />
        <h2 id="race-chart-title" className="text-[20px] uppercase tracking-[0.1em] text-on-surface">
          <span className="sr-only">{t('title', { stat: statName })}</span>
          <span aria-hidden="true">{t('overTime')}</span>
        </h2>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={t('label', { stat: statName, count: chart.lines.length, seconds: chart.seconds })}
          className="h-auto w-full touch-none"
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(null)}
        >
          {chart.yTicks.map((tick) => (
            <g key={tick.value}>
              <line x1={pad.left} x2={width - pad.right} y1={tick.at} y2={tick.at} stroke="#8f1022" strokeOpacity="0.35" />
              <text x={pad.left - 8} y={tick.at + 4} textAnchor="end" fontSize="12" fill="#c9b8bb">{Math.round(tick.value)}</text>
            </g>
          ))}
          {chart.xTicks.map((tick) => (
            <text key={tick.value} x={tick.at} y={height - pad.bottom + 18} textAnchor="middle" fontSize="12" fill="#c9b8bb">{tick.value}</text>
          ))}
          <text x={pad.left + (width - pad.left - pad.right) / 2} y={height - 4} textAnchor="middle" fontSize="12" fill="#c9b8bb">{t('seconds')}</text>
          <text x={12} y={pad.top + (height - pad.top - pad.bottom) / 2} textAnchor="middle" fontSize="12" fill="#c9b8bb" transform={`rotate(-90 12 ${pad.top + (height - pad.top - pad.bottom) / 2})`}>{statName}</text>
          {hover && <line x1={hover.point.point[0]} x2={hover.point.point[0]} y1={pad.top} y2={height - pad.bottom} stroke="#c9b8bb" strokeOpacity="0.4" strokeDasharray="3 3" />}
          {lines.map((line) => {
            const row = rows.find((candidate) => candidate.id === line.id);
            const highlighted = line.id === active;
            return (
              <polyline
                key={line.id}
                data-id={line.id}
                points={line.points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
                fill="none"
                stroke={colorOf(line.id)}
                strokeOpacity={active && !highlighted ? DIMMED : 1}
                strokeWidth={(row?.you ? 3.5 : 1.75) + (highlighted ? 1.5 : 0)}
                strokeDasharray={row?.bot ? '5 4' : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="transition-[stroke-opacity] duration-150"
              />
            );
          })}
          {hover && <circle cx={hover.point.point[0]} cy={hover.point.point[1]} r="5" fill={colorOf(hover.point.id)} stroke="#0c0304" strokeWidth="2" />}
        </svg>

        {hover && (
          <p
            data-testid="chart-tooltip"
            aria-hidden="true"
            className="font-label-code pointer-events-none absolute z-10 border border-[#8f1022] bg-[#0c0304]/95 px-2.5 py-1.5 text-[12px] whitespace-nowrap text-on-surface shadow-[0_8px_16px_rgb(0_0_0/0.5)]"
            style={{
              left: `${hover.at.x}%`,
              top: `${hover.at.y}%`,
              // À droite du curseur, ou à sa gauche près du bord droit : l'infobulle ne sort jamais du graphique.
              transform: hover.at.x > 65 ? 'translate(calc(-100% - 14px), -50%)' : 'translate(14px, -50%)',
            }}
          >
            {t('tooltip', { name: nameOf(hover.point.id), seconds: hover.point.second, value: valueText(hover.point.value) })}
          </p>
        )}
      </div>

      <ul aria-label={t('legend')} className="flex flex-wrap gap-x-2 gap-y-1 text-[14px] text-on-surface-variant">
        {ordered.map((row) => {
          const isPinned = pinned === row.id;
          return (
            <li key={row.id}>
              {/* Épingle la ligne du joueur ; un second clic la libère. Le style change sans changer la taille. */}
              <button
                type="button"
                aria-pressed={isPinned}
                onClick={() => setPinned(isPinned ? null : row.id)}
                className={`flex items-center gap-2 border px-2 py-1 transition-colors hover:text-on-surface ${isPinned ? 'border-[#8f1022] bg-[#3a0c14] text-on-surface' : 'border-transparent'} ${active && active !== row.id ? 'opacity-60' : ''}`}
              >
                <span aria-hidden="true" className="w-5" style={{ background: colorOf(row.id), height: row.you ? 4 : 2 }} />
                <span className={row.you ? 'text-on-surface' : undefined}>{row.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </BevelPanel>
  );
}
