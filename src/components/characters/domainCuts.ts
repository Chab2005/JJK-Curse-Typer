type CutSettings = { interval: number; scale: number; parallel: number };

export type DomainCut = {
  age: number;
  life: number;
  angle: number;
  x: number;
  y: number;
  half: number;
  count: number;
  seed: number;
};

const random = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

/** Deterministic cuts: appear complete, remain stationary, then expire (UI-4). */
export function getDomainCuts(time: number, settings: CutSettings): DomainCut[] {
  const local = time - 2.65;
  if (local < 0) return [];
  const latest = Math.floor(local / settings.interval), cuts: DomainCut[] = [];
  for (let k = Math.max(0, latest - Math.ceil(.5 / settings.interval) - 1); k <= latest; k++) {
    const seed = k + Math.round(settings.scale * 1000);
    const born = k * settings.interval + random(seed + 700) * settings.interval * .6;
    const age = local - born, life = .28 + random(seed + 730) * .2;
    if (age < 0 || age >= life) continue;
    cuts.push({
      age, life, seed,
      angle: random(seed + 760) * Math.PI * 2,
      x: 8 + Math.floor(random(seed + 790) * 384),
      y: 8 + Math.floor(random(seed + 820) * 204),
      half: 24 + Math.floor(random(seed + 850) * 78),
      count: 1 + Math.floor(random(seed + 880) * settings.parallel),
    });
  }
  return cuts;
}
