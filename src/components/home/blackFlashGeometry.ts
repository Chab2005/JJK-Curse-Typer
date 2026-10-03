export type Point = { x: number; y: number };

/** Un tracé de l'éclair (tronc, fourche ou ramification), prêt à dessiner. */
export type Strand = {
  /** Ligne centrale du brin. */
  line: string;
  /** Épaisseur du halo flou ajouté autour de `rim`. */
  glow: number;
  /** Ruban effilé du liseré cramoisi. */
  rim: string;
  /** Ruban effilé du cœur noir. */
  core: string;
};

export type Bolt = {
  /** Le tronc d'abord, puis ses fourches et ramifications. */
  strands: Strand[];
  delay: number;
};

export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function boltPoints(start: Point, end: Point, segments: number, jitter: number, random: () => number): Point[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;
  const normal = { x: -dy / length, y: dx / length };
  // Zigzag : chaque coude change de côté et s'écarte d'au moins un tiers de `jitter`, pour des angles vifs.
  const firstSide = random() < 0.5 ? -1 : 1;

  return Array.from({ length: segments + 1 }, (_, i) => {
    if (i === 0) return start;
    if (i === segments) return end;
    // Coudes inégalement espacés le long de l'axe, pour casser la régularité du zigzag.
    const t = (i + (random() - 0.5) * 0.6) / segments;
    const side = i % 2 === 0 ? -firstSide : firstSide;
    const offset = (side * jitter * (1 + 2 * random())) / 3;
    return { x: start.x + dx * t + normal.x * offset, y: start.y + dy * t + normal.y * offset };
  });
}

const round = (n: number) => Math.round(n * 10) / 10;

export function toPath(points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${round(p.x)} ${round(p.y)}`).join('');
}

const unit = (from: Point, to: Point): Point => {
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return { x: (to.x - from.x) / length, y: (to.y - from.y) / length };
};

/** Position (dans [0, 1]) où l'éclair atteint sa largeur maximale. */
export const WIDTH_PEAK_AT = 0.3;

/** Largeur de référence à la position `t` : part de `baseWidth`, monte jusqu'à `peakWidth` puis s'effile jusqu'à 0. */
export function widthEnvelope(t: number, baseWidth: number, peakWidth: number): number {
  if (t <= WIDTH_PEAK_AT) return baseWidth + (peakWidth - baseWidth) * (t / WIDTH_PEAK_AT);
  return peakWidth * (1 - ((t - WIDTH_PEAK_AT) / (1 - WIDTH_PEAK_AT)) ** 2);
}

/** Largeur à chaque point : suit `widthEnvelope`, avec des renflements et des étranglements au hasard. */
export function boltWidths(count: number, baseWidth: number, peakWidth: number, random: () => number): number[] {
  const last = count - 1;
  return Array.from({ length: count }, (_, i) => {
    const width = widthEnvelope(i / last, baseWidth, peakWidth);
    return i === 0 || i === last ? width : width * (0.5 + random());
  });
}

/** Forme pleine qui suit `points` avec la largeur `widths[i]` à chaque point : un éclair qui finit en pointe si la dernière vaut 0. */
export function ribbonPath(points: Point[], widths: number[]): string {
  const last = points.length - 1;
  const edges = points.map((point, i) => {
    const before = unit(points[Math.max(i - 1, 0)], point);
    const after = unit(point, points[Math.min(i + 1, last)]);
    const direction = i === 0 ? after : i === last ? before : unit({ x: 0, y: 0 }, { x: before.x + after.x, y: before.y + after.y });
    const half = widths[i] / 2;
    return [
      { x: point.x - direction.y * half, y: point.y + direction.x * half },
      { x: point.x + direction.y * half, y: point.y - direction.x * half },
    ];
  });
  return `${toPath([...edges.map(([left]) => left), ...edges.map(([, right]) => right).reverse()])}Z`;
}

const polar = (radius: number, angle: number): Point => ({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });

type Fork = { points: Point[]; widths: number[] };

const CORE_RATIO = 0.45;

const toStrand = ({ points, widths }: Fork, glow: number): Strand => ({
  line: toPath(points),
  glow,
  rim: ribbonPath(points, widths),
  core: ribbonPath(points, widths.map((width) => width * CORE_RATIO)),
});

/** Brin qui part de `parent.points[index]` en déviant de `turn` radians de la direction générale du parent. */
function fork(parent: Fork, index: number, turn: number, reach: number, segments: number, jitter: number, random: () => number): Fork {
  const from = parent.points[index];
  const tip = parent.points.at(-1)!;
  const start = parent.points[0];
  const heading = Math.atan2(tip.y - start.y, tip.x - start.x) + turn;
  const points = boltPoints(from, { x: from.x + reach * Math.cos(heading), y: from.y + reach * Math.sin(heading) }, segments, jitter, random);
  return { points, widths: boltWidths(points.length, 0.6, parent.widths[index] * 0.9, random) };
}

/** `count` éclairs qui partent du centre (0, 0) vers l'extérieur, dans un repère de ±500. */
export function blackFlashBolts(count: number, seed: number, cycleSeconds: number): Bolt[] {
  const random = seededRandom(seed);
  const side = () => (random() < 0.5 ? -1 : 1);

  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (random() - 0.5) * 0.5;
    const start = { x: 0, y: 0 };
    const end = polar(460 + random() * 40, angle + (random() - 0.5) * 0.3);
    const points = boltPoints(start, end, 9 + Math.floor(random() * 5), 14, random);
    const trunk = { points, widths: boltWidths(points.length, 1, 8, random) };
    const last = points.length - 1;

    // Fourche finale : une ou deux pointes de plus que celle du tronc.
    const endForks = Array.from({ length: 1 + Math.floor(random() * 2) }, () =>
      fork(trunk, last - 2 - Math.floor(random() * 2), side() * (0.25 + random() * 0.3), 90 + random() * 70, 4, 10, random),
    );

    // Ramifications latérales, qui peuvent elles-mêmes se diviser une fois.
    const branches = Array.from({ length: 1 + Math.floor(random() * 2) }, () =>
      fork(trunk, 2 + Math.floor(random() * (last - 4)), side() * (0.5 + random() * 0.4), 60 + random() * 70, 3, 9, random),
    );
    const twigs = branches.flatMap((branch) =>
      random() < 0.5 ? [fork(branch, 1 + Math.floor(random() * 2), side() * (0.4 + random() * 0.4), 30 + random() * 40, 2, 6, random)] : [],
    );

    return {
      strands: [
        toStrand(trunk, 3),
        ...endForks.map((f) => toStrand(f, 2)),
        ...branches.map((b) => toStrand(b, 1.5)),
        ...twigs.map((t) => toStrand(t, 1)),
      ],
      delay: round(random() * cycleSeconds) % cycleSeconds,
    };
  });
}
