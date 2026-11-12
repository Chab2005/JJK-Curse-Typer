import { describe, expect, it } from 'vitest';
import { archivedView, legacyView, type PastParticipant } from '@/components/history/pastRace';

const participant = (overrides: Partial<PastParticipant>): PastParticipant => ({
  seatId: 'yuji',
  userId: 7,
  name: 'Yuji',
  avatar: 'yuji',
  isBot: false,
  rank: 1,
  wpm: 72,
  rawWpm: 80,
  accuracy: 95.5,
  errors: 3,
  endedAtMs: 41_600,
  status: 'finished',
  received: 2,
  series: [10, 72],
  statSeries: null,
  missedKeys: [{ char: 'd', errors: 3, hits: 9 }],
  ...overrides,
});

const botName = (number: string) => `Cursed corpse ${number}`;

describe('archivedView (HIST-02)', () => {
  const participants = [
    participant({}),
    participant({ seatId: 'bot-1', userId: null, name: '1', avatar: 'sukuna', isBot: true, rank: 2, wpm: 15, missedKeys: [] }),
    participant({ seatId: 'guest:Nobara', userId: null, name: 'Nobara', rank: 3, status: 'abandoned', endedAtMs: null }),
  ];

  it('rend les rangées du tableau dans l’ordre du classement, avec le joueur repéré', () => {
    const view = archivedView(participants, 7, botName);
    expect(view.you).toBe('yuji');
    expect(view.rows.map((row) => row.name)).toEqual(['Yuji', 'Cursed corpse 1', 'Nobara']);
    expect(view.rows[0]).toMatchObject({ id: 'yuji', you: true, accuracy: 0.955, endedAt: 41_600, received: 2, bot: false });
    expect(view.rows[1]).toMatchObject({ you: false, bot: true });
    expect(view.rows[2]).toMatchObject({ status: 'abandoned', endedAt: null });
  });

  it('rend la série et les touches ratées de chacun pour les graphiques', () => {
    const view = archivedView(participants, 7, botName);
    expect(view.series[0]).toEqual({ id: 'yuji', samples: [10, 72], missed: [{ char: 'd', errors: 3, hits: 9 }] });
    expect(view.series).toHaveLength(3);
  });

  it('remet dans l’ordre du rang des participants lus dans le désordre', () => {
    expect(archivedView([...participants].reverse(), 7, botName).rows.map((row) => row.rank)).toEqual([1, 2, 3]);
  });
});

describe('legacyView (HIST-02, course d’avant l’archivage)', () => {
  it('rend la seule rangée du joueur, avec sa série si elle a été gardée', () => {
    const view = legacyView({ rank: 2, wpm: 60, rawWpm: null, accuracy: 90, errors: 4, durationSeconds: 42, status: null, received: null, series: [20, 60] }, { username: 'yuji', name: 'Yuji' });
    expect(view.you).toBe('yuji');
    expect(view.rows).toEqual([
      expect.objectContaining({ id: 'yuji', rank: 2, name: 'Yuji', wpm: 60, rawWpm: 60, accuracy: 0.9, errors: 4, endedAt: 42_000, received: 0, status: 'finished', you: true }),
    ]);
    expect(view.series).toEqual([{ id: 'yuji', samples: [20, 60], missed: [] }]);
  });

  it('sans rang ni série : premier, aucun graphique', () => {
    const view = legacyView({ rank: null, wpm: 60, rawWpm: 61, accuracy: 90, errors: 4, durationSeconds: 42, status: 'abandoned', received: 1, series: null }, { username: 'yuji', name: 'Yuji' });
    expect(view.rows[0]).toMatchObject({ rank: 1, status: 'abandoned', endedAt: null, rawWpm: 61 });
    expect(view.series).toEqual([]);
  });
});

describe('views of another player’s race', () => {
  it('marks no row as the viewer’s when the viewer was not in the race', () => {
    const view = archivedView([participant({})], 99, botName);
    expect(view.you).toBeNull();
    expect(view.rows[0].you).toBe(false);
  });

  it('shows the owner’s legacy row without calling it the viewer’s', () => {
    const view = legacyView({ rank: 2, wpm: 60, rawWpm: null, accuracy: 90, errors: 4, durationSeconds: 42, status: null, received: null, series: null }, { username: 'yuji', name: 'Yuji' }, false);
    expect(view.you).toBeNull();
    expect(view.rows[0]).toMatchObject({ id: 'yuji', name: 'Yuji', you: false });
  });
});

describe('stats over time of a past race', () => {
  it('passes the other recorded stats to the chart, and none for a race saved before them', () => {
    const stats = { rawWpm: [12, 80], accuracy: [100, 95.5], errors: [0, 3], progress: [20, 100] };
    const view = archivedView([participant({ statSeries: stats }), participant({ seatId: 'old', userId: null, rank: 2 })], 7, botName);
    expect(view.series[0]).toMatchObject({ id: 'yuji', samples: [10, 72], stats });
    expect(view.series[1].stats).toBeUndefined();
  });
});
