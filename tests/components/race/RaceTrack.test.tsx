import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RaceTrack from '@/components/race/RaceTrack';
import type { TrackRunner } from '@/components/race/raceView';
import type { RacerSeat } from '@/game/race';
import { renderWithIntl } from '../../render';

const seat = (id: string, kind: 'human' | 'bot' = 'human'): RacerSeat => ({ id, name: id, avatar: null, kind, level: null });

const RUNNERS: TrackRunner[] = [
  { seat: seat('Megumi'), x: 0.3, rank: 2, wpm: 61, status: 'racing', leader: false, you: true, big: true, lane: 0, character: 'megumi', running: true, marks: [] },
  { seat: seat('Yuji'), x: 0.6, rank: 1, wpm: 80, status: 'racing', leader: true, you: false, big: true, lane: 1, character: 'yuji', running: false, marks: [] },
  { seat: seat('1', 'bot'), x: 1, rank: 3, wpm: 70, status: 'finished', leader: false, you: false, big: false, lane: 2, character: 'todo', running: false, marks: [] },
];

describe('RaceTrack bot badge (BOT-04)', () => {
  it('shows a Bot badge on bot plates only', () => {
    renderWithIntl(<RaceTrack runners={RUNNERS} banner="" nameOf={(s) => s.name} />);
    const plates = screen.getAllByTestId('runner-plate');
    expect(plates.map((plate) => within(plate).queryAllByTestId('bot-badge').length)).toEqual([0, 0, 1]);
  });
});

describe('RaceTrack nameplates (COURSE-05)', () => {
  it('shows each racer name, avatar and live WPM on the track, not only in a title', () => {
    renderWithIntl(<RaceTrack runners={RUNNERS} banner="" nameOf={(s) => (s.kind === 'bot' ? `Bot ${s.name}` : s.name)} />);

    const plates = screen.getAllByTestId('runner-plate');
    expect(plates).toHaveLength(3);
    expect(plates.map((plate) => plate.textContent)).toEqual(expect.arrayContaining([expect.stringContaining('Megumi'), expect.stringContaining('Yuji'), expect.stringContaining('Bot 1')]));
    const yuji = plates.find((plate) => plate.textContent?.includes('Yuji'))!;
    expect(yuji).toHaveTextContent('80 WPM');
    expect(yuji.querySelector('img, [data-avatar]')).not.toBeNull();
    // Visible: the plate is not hidden from sighted users (the screen-reader list stays separate).
    expect(yuji).not.toHaveClass('sr-only');
  });
});

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

  it('draws each racer as their character, running when they move and idle otherwise', () => {
    renderWithIntl(<RaceTrack runners={RUNNERS} banner="" nameOf={(s) => s.name} />);

    const sprite = (title: string) => screen.getByTitle(title).querySelector<HTMLElement>('[style*="background"]')!.style.background;
    expect(sprite('Megumi · You')).toContain('/images/characters/anim/megumi-running.png');
    expect(sprite('Yuji · Leader')).toContain('/images/characters/anim/yuji-idle.png');
  });

  it('shows the banner in the animation zone', () => {
    renderWithIntl(<RaceTrack runners={RUNNERS} banner="You passed Yuji!" nameOf={(s) => s.name} />);

    expect(screen.getByText('You passed Yuji!')).toBeInTheDocument();
  });

  it('draws two hits landing on a racer in the same tick without a key clash', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const hits = [{ target: 'Yuji', ability: 'nue', at: 1000 }, { target: 'Yuji', ability: 'blackFlash', at: 1000 }, { target: 'Yuji', ability: 'blackFlash', at: 1000 }] as const;
    renderWithIntl(<RaceTrack runners={RUNNERS} banner="" nameOf={(seat) => seat.name} hits={hits} />);

    expect(screen.getAllByTestId('runner-hit')).toHaveLength(3);
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
