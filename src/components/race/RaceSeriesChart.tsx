import { useTranslations } from 'next-intl';
import BevelPanel from '@/components/shared/BevelPanel';
import type { SeriesEntry } from '@/game/series';
import type { SummaryRow } from './RaceSummary';
import { type ChartSize, chartLines } from './seriesChart';

const SIZE: ChartSize = { width: 720, height: 280, pad: { left: 48, right: 20, top: 16, bottom: 34 } };
/** Teintes assez distinctes pour 30 lignes : au-delà de dix, elles se répètent (traits pleins, puis pointillés pour les bots). */
const COLORS = ['#ff5577', '#e0b84c', '#4fd1a5', '#6aa6ff', '#c58bff', '#ff9a5a', '#7ee0e0', '#b0d65a', '#ff7fb0', '#9aa3b5'];

/** Couleur de la ligne de chaque participant, dans l'ordre du classement ; celle du joueur est toujours la première teinte. */
export const lineColor = (index: number) => COLORS[index % COLORS.length];

// MPM de tous les participants seconde par seconde (RES-03) : une ligne par participant sur des axes communs.
// La légende nomme chaque ligne ; la ligne du joueur est plus épaisse, celles des bots en pointillés.
export default function RaceSeriesChart({ series, rows }: { series: SeriesEntry[]; rows: SummaryRow[] }) {
  const t = useTranslations('Race.summary.chart');
  const chart = chartLines(series, SIZE);
  const { width, height, pad } = SIZE;
  const ordered = rows.filter((row) => series.some((entry) => entry.id === row.id));
  const colorOf = (id: string) => lineColor(Math.max(0, ordered.findIndex((row) => row.id === id)));

  return (
    <BevelPanel as="section" aria-labelledby="race-chart-title" className="flex flex-col gap-5 px-5 pt-6 pb-7 sm:px-8">
      <h2 id="race-chart-title" className="flex items-center gap-2.5 text-[20px] uppercase tracking-[0.1em] text-on-surface">
        <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-primary-text">show_chart</span>
        {t('title')}
      </h2>

      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={t('label', { count: series.length, seconds: chart.seconds })} className="h-auto w-full">
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
        <text x={12} y={pad.top + (height - pad.top - pad.bottom) / 2} textAnchor="middle" fontSize="12" fill="#c9b8bb" transform={`rotate(-90 12 ${pad.top + (height - pad.top - pad.bottom) / 2})`}>{t('wpm')}</text>
        {chart.lines.map((line) => {
          const row = rows.find((candidate) => candidate.id === line.id);
          return (
            <polyline
              key={line.id}
              points={line.points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
              fill="none"
              stroke={colorOf(line.id)}
              strokeWidth={row?.you ? 3.5 : 1.75}
              strokeDasharray={row?.bot ? '5 4' : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      <ul aria-label={t('legend')} className="flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-on-surface-variant">
        {ordered.map((row) => (
          <li key={row.id} className="flex items-center gap-2">
            <span aria-hidden="true" className="h-0.5 w-5" style={{ background: colorOf(row.id), height: row.you ? 4 : 2 }} />
            <span className={row.you ? 'text-on-surface' : undefined}>{row.name}</span>
          </li>
        ))}
      </ul>
    </BevelPanel>
  );
}
