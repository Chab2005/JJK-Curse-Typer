export type Point = { x: number; y: number };

export type Bolt = {
  main: string;
  branches: string[];
  /** Rubans effilés (liseré cramoisi) : l'éclair principal puis chaque ramification. */
  rim: string[];
  /** Rubans effilés (cœur noir), dans le même ordre que `rim`. */
  core: string[];
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

/** Forme pleine qui suit `points` en s'affinant de `startWidth` à `endWidth` : un éclair qui finit en pointe. */
export function ribbonPath(points: Point[], startWidth: number, endWidth: number): string {
  const last = points.length - 1;
  const edges = points.map((point, i) => {
    const before = unit(points[Math.max(i - 1, 0)], point);
    const after = unit(point, points[Math.min(i + 1, last)]);
    const direction = i === 0 ? after : i === last ? before : unit({ x: 0, y: 0 }, { x: before.x + after.x, y: before.y + after.y });
    const half = (startWidth + (endWidth - startWidth) * (i / last)) / 2;
    return [
      { x: point.x - direction.y * half, y: point.y + direction.x * half },
      { x: point.x + direction.y * half, y: point.y - direction.x * half },
    ];
  });
  return `${toPath([...edges.map(([left]) => left), ...edges.map(([, right]) => right).reverse()])}Z`;
}

export const BOLT_START_RADIUS = 20;

const polar = (radius: number, angle: number): Point => ({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });

export function blackFlashBolts(count: number, seed: number, cycleSeconds: number): Bolt[] {
  const random = seededRandom(seed);

  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (random() - 0.5) * 0.5;
    const start = polar(BOLT_START_RADIUS, angle);
    const end = polar(460 + random() * 40, angle + (random() - 0.5) * 0.3);
    const points = boltPoints(start, end, 9 + Math.floor(random() * 5), 14, random);

    const branchPoints = Array.from({ length: 1 + Math.floor(random() * 2) }, () => {
      const from = points[2 + Math.floor(random() * (points.length - 4))];
      const side = random() < 0.5 ? -1 : 1;
      const branchAngle = Math.atan2(from.y, from.x) + side * (0.4 + random() * 0.4);
      const reach = 50 + random() * 70;
      const to = { x: from.x + reach * Math.cos(branchAngle), y: from.y + reach * Math.sin(branchAngle) };
      return boltPoints(from, to, 3, 9, random);
    });

    return {
      main: toPath(points),
      branches: branchPoints.map(toPath),
      rim: [ribbonPath(points, 6, 0), ...branchPoints.map((branch) => ribbonPath(branch, 3.5, 0))],
      core: [ribbonPath(points, 2.8, 0), ...branchPoints.map((branch) => ribbonPath(branch, 1.6, 0))],
      delay: round(random() * cycleSeconds) % cycleSeconds,
    };
  });
}
