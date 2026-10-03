import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RaceTrack from '@/components/race/RaceTrack';
import type { TrackRunner } from '@/components/race/raceView';
import type { RacerSeat } from '@/game/race';
import { renderWithIntl } from '../../render';

const seat = (id: string, kind: 'human' | 'bot' = 'human'): RacerSeat => ({ id, name: id, avatar: null, kind, level: null });

const RUNNERS: TrackRunner[] = [
  { seat: seat('Megumi'), x: 0.3, rank: 2, wpm: 61, status: 'racing', leader: false, you: true, big: true, lane: 0 },
  { seat: seat('Yuji'), x: 0.6, rank: 1, wpm: 80, status: 'racing', leader: true, you: false, big: true, lane: 1 },
  { seat: seat('1', 'bot'), x: 1, rank: 3, wpm: 70, status: 'finished', leader: false, you: false, big: false, lane: 2 },
];

describe('RaceTrack (RACE-2, RACE-3)', () => {
  it('lists every racer in rank order for screen readers', () => {
    renderWithIntl(<RaceTrack runners={RUNNERS} banner="Yuji leads the race" nameOf={(s) => (s.kind === 'bot' ? `Bot ${s.name}` : s.name)} />);

    const rows = within(screen.getByRole('list', { name: 'Live standings' })).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      '1. Yuji: 60% · 80 WPM · Racing',
      '2. Megumi (you): 30% · 61 WPM · Racing',
      '3. Bot 1: 100% · 70 WPM · Finished',
    ]);
  });

  it('marks the leader and the player on the track, not only by size (UI-8)', () => {
    renderWithIntl(<RaceTrack runners={RUNNERS} banner="" nameOf={(s) => s.name} />);

    expect(screen.getByTitle('Yuji · Leader')).toBeInTheDocument();
    expect(screen.getByTitle('Megumi · You')).toBeInTheDocument();
  });

  it('shows the banner in the animation zone', () => {
    renderWithIntl(<RaceTrack runners={RUNNERS} banner="You passed Yuji!" nameOf={(s) => s.name} />);

    expect(screen.getByText('You passed Yuji!')).toBeInTheDocument();
  });
});
