import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RaceSeriesChart from '@/components/race/RaceSeriesChart';
import type { SummaryRow } from '@/components/race/RaceSummary';
import type { SeriesEntry } from '@/game/series';
import { renderWithIntl } from '../../render';

const row = (id: string, name: string, rank: number, extra: Partial<SummaryRow> = {}): SummaryRow => ({
  id, rank, name, avatar: null, wpm: 0, rawWpm: 0, accuracy: 1, errors: 0, endedAt: null, received: 0, status: 'finished', you: false, ...extra,
});

const ROWS = [row('yuji', 'Yuji', 1), row('me', 'Megumi', 2, { you: true }), row('bot-1', 'Cursed corpse 1', 3, { bot: true })];
const stats = (accuracy: number[]) => ({ rawWpm: [0, 45, 90], accuracy, errors: [0, 1, 2], progress: [0, 50, 100] });
const SERIES: SeriesEntry[] = [
  { id: 'yuji', samples: [0, 40, 81], stats: stats([100, 98, 96.5]), missed: [] },
  { id: 'me', samples: [0, 30, 64], stats: stats([100, 90, 88]), missed: [] },
  { id: 'bot-1', samples: [0, 20, 30], stats: stats([100, 95, 94]), missed: [] },
];

// Le viewBox fait 720 × 280 : une boîte de même taille rend les coordonnées du curseur égales à celles du dessin.
function renderChart(series: SeriesEntry[] = SERIES) {
  const view = renderWithIntl(<RaceSeriesChart series={series} rows={ROWS} />);
  const svg = screen.getByRole('img');
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 720, height: 280, right: 720, bottom: 280, x: 0, y: 0, toJSON: () => ({}) });
  return { ...view, svg };
}

/** Point de la ligne `id` à la seconde `second`, lu dans le dessin. */
function pointOf(svg: Element, id: string, second: number): [number, number] {
  const points = svg.querySelector(`polyline[data-id="${id}"]`)!.getAttribute('points')!.split(' ');
  const [x, y] = points[second].split(',').map(Number);
  return [x, y];
}

const opacity = (svg: Element, id: string) => svg.querySelector(`polyline[data-id="${id}"]`)!.getAttribute('stroke-opacity');

describe('RaceSeriesChart (RES-03)', () => {
  it('titles the chart with a stat dropdown followed by "over time", WPM first', () => {
    renderChart();
    expect(screen.getByRole('heading', { name: 'WPM over time' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Stat shown' })).toHaveTextContent('WPM');
    expect(screen.getByRole('img', { name: /^WPM over time for 3 participants/ })).toBeInTheDocument();
  });

  it('switches every line, the axis and the title to the chosen stat', async () => {
    const { user, svg } = renderChart();
    await user.click(screen.getByRole('combobox', { name: 'Stat shown' }));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['WPM', 'Raw WPM', 'Accuracy', 'Errors', 'Progress']);
    await user.click(screen.getByRole('option', { name: 'Accuracy' }));

    expect(screen.getByRole('heading', { name: 'Accuracy over time' })).toBeInTheDocument();
    expect(svg).toHaveAccessibleName(/^Accuracy over time/);
    expect(within(svg as unknown as HTMLElement).getByText('100')).toBeInTheDocument();
  });

  it('offers only WPM for a race saved before the other stats', async () => {
    const { user } = renderChart(SERIES.map(({ id, samples, missed }) => ({ id, samples, missed })));
    await user.click(screen.getByRole('combobox', { name: 'Stat shown' }));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['WPM']);
  });

  it('highlights the line under the cursor and shows its value at that second', () => {
    const { svg } = renderChart();
    const [x, y] = pointOf(svg, 'yuji', 2);
    fireEvent.pointerMove(svg, { clientX: x - 4, clientY: y + 2 });

    expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('Yuji · 2 s · 81 WPM');
    expect(opacity(svg, 'yuji')).toBe('1');
    expect(opacity(svg, 'me')).toBe('0.25');

    fireEvent.pointerLeave(svg);
    expect(screen.queryByTestId('chart-tooltip')).not.toBeInTheDocument();
    expect(opacity(svg, 'me')).toBe('1');
  });

  it('pins a player from the legend: their line stays highlighted and the cursor reads their value', async () => {
    const { user, svg } = renderChart();
    const legend = within(screen.getByRole('list', { name: 'Participants' }));
    await user.click(legend.getByRole('button', { name: 'Megumi' }));
    expect(legend.getByRole('button', { name: 'Megumi' })).toHaveAttribute('aria-pressed', 'true');
    expect(opacity(svg, 'me')).toBe('1');
    expect(opacity(svg, 'yuji')).toBe('0.25');

    // Même sur la ligne de Yuji, le curseur lit celle de Megumi à cette seconde.
    const [x, y] = pointOf(svg, 'yuji', 1);
    fireEvent.pointerMove(svg, { clientX: x, clientY: y });
    expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('Megumi · 1 s · 30 WPM');

    await user.click(legend.getByRole('button', { name: 'Megumi' }));
    expect(legend.getByRole('button', { name: 'Megumi' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('formats the value of the chosen stat in the tooltip', async () => {
    const { user, svg } = renderChart();
    await user.click(screen.getByRole('combobox', { name: 'Stat shown' }));
    await user.click(screen.getByRole('option', { name: 'Accuracy' }));
    const [x, y] = pointOf(svg, 'me', 2);
    fireEvent.pointerMove(svg, { clientX: x, clientY: y });
    expect(screen.getByTestId('chart-tooltip')).toHaveTextContent('Megumi · 2 s · 88% accuracy');
  });
});
