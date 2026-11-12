import { describe, expect, it } from 'vitest';
import { availableStats, chartLines, nearestPoint, niceMax, missedStats, statValues } from '@/components/race/seriesChart';

describe('niceMax', () => {
  it('rounds the top of the axis up to a round number, never below 20', () => {
    expect(niceMax(0)).toBe(20);
    expect(niceMax(37)).toBe(40);
    expect(niceMax(81)).toBe(100);
    expect(niceMax(150)).toBe(150);
    expect(niceMax(151)).toBe(200);
  });
});

describe('chartLines (RES-03)', () => {
  const series = [
    { id: 'me', samples: [0, 30, 90], missed: [] },
    { id: 'bot-1', samples: [0, 20], missed: [] },
  ];
  const size = { width: 400, height: 200, pad: { left: 40, right: 10, top: 10, bottom: 20 } };

  it('draws one line per participant on shared axes, the longest series setting the time axis', () => {
    const chart = chartLines(series, size);
    expect(chart.lines.map((l) => l.id)).toEqual(['me', 'bot-1']);
    expect(chart.seconds).toBe(2);
    expect(chart.yMax).toBe(100);
    const me = chart.lines[0].points;
    // 0 s at the left edge, 2 s at the right edge, 90 WPM of a 100 axis, 90 % of the plot height.
    expect(me[0]).toEqual([40, 180]);
    expect(me[2]).toEqual([390, 180 - 0.9 * 170]);
    expect(chart.lines[1].points[1][0]).toBe(40 + 350 / 2);
  });

  it('puts ticks on the axes', () => {
    const chart = chartLines(series, size);
    expect(chart.yTicks.map((tick) => tick.value)).toEqual([0, 25, 50, 75, 100]);
    expect(chart.xTicks[0].value).toBe(0);
    expect(chart.xTicks.at(-1)!.value).toBe(2);
  });

  it('copes with an empty or one-point series', () => {
    expect(chartLines([], size).lines).toEqual([]);
    expect(chartLines([{ id: 'a', samples: [10], missed: [] }], size).lines[0].points).toHaveLength(1);
  });
});

describe('missedStats', () => {
  it('turns the missed keys into heatmap stats with the error rate in percent', () => {
    expect(missedStats([{ char: 'd', errors: 1, hits: 3 }])).toEqual([{ char: 'd', errorRate: 25, avgMs: 0 }]);
  });
});

describe('stats of the chart', () => {
  const stats = { rawWpm: [0, 35, 95], accuracy: [100, 96, 92.5], errors: [0, 1, 3], progress: [0, 40, 100] };
  const series = [
    { id: 'me', samples: [0, 30, 90], stats, missed: [] },
    { id: 'old', samples: [0, 20], missed: [] },
  ];
  const size = { width: 400, height: 200, pad: { left: 40, right: 10, top: 10, bottom: 20 } };

  it('reads the net WPM from the samples and the other stats beside them', () => {
    expect(statValues(series[0], 'wpm')).toEqual([0, 30, 90]);
    expect(statValues(series[0], 'errors')).toEqual([0, 1, 3]);
    expect(statValues(series[1], 'accuracy')).toBeNull();
  });

  it('lists the stats some participant recorded, net WPM always first', () => {
    expect(availableStats(series)).toEqual(['wpm', 'rawWpm', 'accuracy', 'errors', 'progress']);
    expect(availableStats([series[1]])).toEqual(['wpm']);
  });

  it('draws only the participants who have the chosen stat', () => {
    expect(chartLines(series, size, 'progress').lines.map((l) => l.id)).toEqual(['me']);
  });

  it('puts percentages on a 0 to 100 axis and a few errors on a 0 to 10 axis', () => {
    expect(chartLines(series, size, 'accuracy').yMax).toBe(100);
    expect(chartLines(series, size, 'progress').yMax).toBe(100);
    expect(chartLines(series, size, 'errors').yMax).toBe(10);
    expect(chartLines(series, size, 'rawWpm').yMax).toBe(100);
  });
});

describe('nearestPoint (hover)', () => {
  const series = [
    { id: 'fast', samples: [0, 60, 90, 100], missed: [] },
    { id: 'slow', samples: [0, 20, 30], missed: [] },
  ];
  const size = { width: 400, height: 200, pad: { left: 40, right: 10, top: 10, bottom: 20 } };
  const chart = chartLines(series, size);
  const [fast, slow] = chart.lines;

  it('picks the line closest to the cursor at the nearest second, with its value', () => {
    const [x, y] = fast.points[2];
    expect(nearestPoint(chart, x + 10, y + 5)).toEqual({ id: 'fast', second: 2, value: 90, point: fast.points[2] });
    expect(nearestPoint(chart, slow.points[1][0], slow.points[1][1] - 3)).toMatchObject({ id: 'slow', second: 1, value: 20 });
  });

  it('skips a line that already ended, unless it is the one asked for', () => {
    const x = fast.points[3][0];
    expect(nearestPoint(chart, x, slow.points[2][1])?.id).toBe('fast');
    expect(nearestPoint(chart, x, 0, 'slow')).toMatchObject({ id: 'slow', second: 2, value: 30 });
  });

  it('follows only the pinned line when one is given', () => {
    expect(nearestPoint(chart, fast.points[1][0], fast.points[1][1], 'slow')).toMatchObject({ id: 'slow', second: 1, value: 20 });
  });

  it('finds nothing outside the plot', () => {
    expect(nearestPoint(chart, 10, 100)).toBeNull();
    expect(nearestPoint(chart, 395, 100)).toBeNull();
  });
});
