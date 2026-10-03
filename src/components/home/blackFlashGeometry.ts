export type Point = { x: number; y: number };

export type Bolt = {
  main: string;
  branches: string[];
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

  return Array.from({ length: segments + 1 }, (_, i) => {
    if (i === 0) return start;
    if (i === segments) return end;
    const t = i / segments;
    const offset = (random() * 2 - 1) * jitter;
    return { x: start.x + dx * t + normal.x * offset, y: start.y + dy * t + normal.y * offset };
  });
}

const round = (n: number) => Math.round(n * 10) / 10;

export function toPath(points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${round(p.x)} ${round(p.y)}`).join('');
}

export const BOLT_START_RADIUS = 20;

const polar = (radius: number, angle: number): Point => ({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });

export function blackFlashBolts(count: number, seed: number, cycleSeconds: number): Bolt[] {
  const random = seededRandom(seed);

  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (random() - 0.5) * 0.5;
    const start = polar(BOLT_START_RADIUS, angle);
    const end = polar(460 + random() * 40, angle + (random() - 0.5) * 0.3);
    const points = boltPoints(start, end, 16 + Math.floor(random() * 6), 18, random);

    const branches = Array.from({ length: 1 + Math.floor(random() * 2) }, () => {
      const from = points[2 + Math.floor(random() * (points.length - 4))];
      const side = random() < 0.5 ? -1 : 1;
      const branchAngle = Math.atan2(from.y, from.x) + side * (0.4 + random() * 0.4);
      const reach = 50 + random() * 70;
      const to = { x: from.x + reach * Math.cos(branchAngle), y: from.y + reach * Math.sin(branchAngle) };
      return toPath(boltPoints(from, to, 4, 12, random));
    });

    return { main: toPath(points), branches, delay: round(random() * cycleSeconds) % cycleSeconds };
  });
}
