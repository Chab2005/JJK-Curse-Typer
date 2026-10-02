// Géométrie pure des éclairs « Black Flash » du hero : aucune I/O, tirages seedés
// pour que le serveur et le client produisent exactement les mêmes tracés.

export type Point = { x: number; y: number };

export type Bolt = {
  /** Tracé SVG de l'éclair principal. */
  main: string;
  /** Tracés des petites ramifications. */
  branches: string[];
  /** Décalage de l'animation, en secondes, dans [0, durée du cycle). */
  delay: number;
};

/** Générateur pseudo-aléatoire déterministe (mulberry32), valeurs dans [0, 1). */
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

/** Ligne brisée de `start` à `end` : chaque point intermédiaire s'écarte d'au plus `jitter`. */
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

const polar = (radius: number, angle: number): Point => ({ x: radius * Math.cos(angle), y: radius * Math.sin(angle) });

/** `count` éclairs qui partent du centre (0, 0) vers l'extérieur, dans un repère de ±500. */
export function blackFlashBolts(count: number, seed: number, cycleSeconds: number): Bolt[] {
  const random = seededRandom(seed);

  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (random() - 0.5) * 0.5;
    const start = polar(40 + random() * 30, angle);
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
