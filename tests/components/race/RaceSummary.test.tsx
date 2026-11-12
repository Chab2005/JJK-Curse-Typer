import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RaceSummary, { type SummaryRow } from '@/components/race/RaceSummary';
import { renderWithIntl } from '../../render';

const ROWS: SummaryRow[] = [
  { id: 'yuji', rank: 1, name: 'Yuji', avatar: 'yuji', wpm: 81, rawWpm: 84, errors: 2, endedAt: 30000, received: 1, accuracy: 0.97, status: 'finished', you: false },
  { id: 'me', rank: 2, name: 'Megumi', avatar: 'megumi', wpm: 64, rawWpm: 67, errors: 2, endedAt: 30000, received: 1, accuracy: 0.952, status: 'finished', you: true },
  { id: 'bot-1', rank: 3, name: 'Cursed corpse 1', avatar: null, wpm: 30, rawWpm: 33, errors: 2, endedAt: 30000, received: 1, accuracy: 0.9, status: 'racing', you: false },
];

describe('RaceSummary', () => {
  it('shows the player’s result while the others keep racing (RACE-11)', () => {
    renderWithIntl(<RaceSummary rows={ROWS} you="me" over={false} lobbyCode="TKY-HGH" />);

    expect(screen.getByRole('heading', { name: 'Finished!' })).toBeInTheDocument();
    expect(screen.getByText('Position 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('64 WPM · 95% accuracy')).toBeInTheDocument();
    expect(screen.getByText('1 exorcist is still racing…')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Race podium' })).not.toBeInTheDocument();
  });

  it('shows the podium, the rest of the field and the way back once the race is over (RACE-14)', () => {
    const rows: SummaryRow[] = [
      ...ROWS.map((r) => ({ ...r, status: 'finished' as const })),
      { id: 'bot-2', rank: 4, name: 'Cursed corpse 2', avatar: null, wpm: 22, rawWpm: 25, errors: 2, endedAt: 30000, received: 1, accuracy: 0.88, status: 'abandoned', you: false },
    ];
    renderWithIntl(<RaceSummary rows={rows} you="me" over lobbyCode="TKY-HGH" />);

    const podium = within(screen.getByRole('region', { name: 'Race podium' }));
    expect(podium.getByText('Yuji')).toBeInTheDocument();
    expect(podium.getByText('Cursed corpse 1')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Results' });
    // Header + every racer: the podium is repeated in the full table (RES-02).
    expect(within(table).getAllByRole('row')).toHaveLength(5);
    expect(within(table).getByText('Cursed corpse 2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the lobby' })).toHaveAttribute('href', '/lobby/TKY-HGH');
  });

  it('puts the lobby actions in place of the way back when given (COURSE-11)', () => {
    renderWithIntl(<RaceSummary rows={ROWS} you="me" over lobbyCode="ABC-DEF" actions={<button type="button">Restart the race</button>} />);
    expect(screen.getByRole('button', { name: 'Restart the race' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Back to the lobby' })).not.toBeInTheDocument();
  });

  it('marks a beaten personal best in the player’s row and in the Finished panel (RES-04)', () => {
    const rows = ROWS.map((r) => (r.id === 'me' ? { ...r, record: true } : r.id === 'bot-1' ? { ...r, bot: true } : r));
    renderWithIntl(<RaceSummary rows={rows} you="me" over lobbyCode="TKY-HGH" />);

    const panel = screen.getByRole('heading', { name: 'Finished!' }).parentElement!;
    expect(within(panel).getByTestId('record-badge')).not.toHaveClass('invisible');
    const table = within(screen.getByRole('table', { name: 'Results' }));
    const mine = table.getByText('Megumi').closest('tr')!;
    expect(within(mine).getByTestId('record-badge')).not.toHaveClass('invisible');
    const yuji = table.getByText('Yuji').closest('tr')!;
    expect(within(yuji).getByTestId('record-badge')).toHaveClass('invisible');
    // Un bot ne bat jamais de record : aucune place gardée.
    expect(within(table.getByText('Cursed corpse 1').closest('tr')!).queryByTestId('record-badge')).toBeNull();
  });

  it('keeps the top 3 in the full table too (RES-02)', () => {
    renderWithIntl(<RaceSummary rows={ROWS.map((r) => ({ ...r, status: 'finished' }))} you="me" over lobbyCode="TKY-HGH" />);

    expect(screen.getByRole('region', { name: 'Race podium' })).toBeInTheDocument();
    expect(within(screen.getByRole('table', { name: 'Results' })).getAllByRole('row')).toHaveLength(4);
  });

  it('tells the player they abandoned', () => {
    renderWithIntl(<RaceSummary rows={[{ ...ROWS[1], status: 'abandoned' }]} you="me" over={false} lobbyCode="TKY-HGH" />);

    expect(screen.getByRole('heading', { name: 'You abandoned the race' })).toBeInTheDocument();
  });
});

describe('RaceSummary charts (RES-03)', () => {
  const series = [
    { id: 'yuji', samples: [0, 40, 81], missed: [{ char: 'q', errors: 2, hits: 8 }] },
    { id: 'me', samples: [0, 30, 64], missed: [{ char: 'd', errors: 3, hits: 7 }] },
    { id: 'bot-1', samples: [0, 20, 30], missed: [] },
  ];
  const done: SummaryRow[] = ROWS.map((r) => ({ ...r, status: 'finished' as const }));

  it('draws the WPM of every participant over time with a legend, once the series arrived', () => {
    renderWithIntl(<RaceSummary rows={done} you="me" over series={series} lobbyCode="TKY-HGH" />);

    const chart = screen.getByRole('img', { name: /WPM over time/ });
    expect(chart.querySelectorAll('polyline')).toHaveLength(3);
    const legend = within(screen.getByRole('list', { name: 'Participants' }));
    expect(legend.getAllByRole('listitem')).toHaveLength(3);
    expect(legend.getByText('Megumi')).toBeInTheDocument();
  });

  it('shows the missed keys of the viewer first, and of any other participant on request', async () => {
    const { user } = renderWithIntl(<RaceSummary rows={done} you="me" over series={series} lobbyCode="TKY-HGH" />);

    const keyboard = screen.getByRole('region', { name: 'Missed keys' });
    expect(within(keyboard).getByText('d · 30%')).toBeInTheDocument();
    expect(within(keyboard).queryByRole('button', { name: 'Speed' })).not.toBeInTheDocument();

    await user.click(within(keyboard).getByRole('combobox', { name: 'Player' }));
    await user.click(screen.getByRole('option', { name: 'Yuji' }));
    expect(within(keyboard).getByText('q · 20%')).toBeInTheDocument();
  });

  it('shows no chart while the race runs or when the series are missing', () => {
    renderWithIntl(<RaceSummary rows={done} you="me" over={false} series={series} lobbyCode="TKY-HGH" />);
    expect(screen.queryByRole('img', { name: /WPM over time/ })).not.toBeInTheDocument();
  });
});

