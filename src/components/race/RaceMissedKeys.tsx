'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import KeyboardHeatmap from '@/components/profile/KeyboardHeatmap';
import BevelSelect from '@/components/shared/BevelSelect';
import type { SeriesEntry } from '@/game/series';
import type { SummaryRow } from './RaceSummary';
import { missedStats } from './seriesChart';

// Touches ratées de chaque joueur de la course (RES-03) : la carte de chaleur du clavier, en taux d'erreur, pour le joueur
// de l'écran d'abord, et pour n'importe quel autre participant au choix.
export default function RaceMissedKeys({ series, rows, you }: { series: SeriesEntry[]; rows: SummaryRow[]; you: string | null }) {
  const t = useTranslations('Race.summary.missed');
  const entries = rows.filter((row) => series.some((entry) => entry.id === row.id));
  const [picked, setPicked] = useState<string | null>(null);
  const shown = picked ?? (entries.some((row) => row.id === you) ? you : entries[0]?.id) ?? null;
  if (shown === null) return null;

  const stats = missedStats(series.find((entry) => entry.id === shown)?.missed ?? []);
  const nameOf = (id: string) => entries.find((row) => row.id === id)?.name ?? id;

  return (
    <KeyboardHeatmap
      stats={stats}
      modes={['errors']}
      title={t('title')}
      headerExtra={
        <div className="flex items-center gap-2.5">
          <span id="missed-player-label" className="font-label-code text-[12px] uppercase tracking-[0.16em] text-on-surface-variant">{t('player')}</span>
          <BevelSelect labelId="missed-player-label" options={entries.map((row) => row.id)} value={shown} onChange={setPicked} optionLabel={nameOf} />
        </div>
      }
    />
  );
}
