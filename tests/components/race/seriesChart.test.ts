import { describe, expect, it } from 'vitest';
import { chartLines, niceMax, missedStats } from '@/components/race/seriesChart';

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
