/** Stable variation for server-rendered artwork: no random changes during typing or hydration. */
export function auraRandom(seed: number): number {
  let value = Math.imul(seed + 1, 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

/** BON-1: equal point counts and a seamless eight-frame cycle allow continuous SVG morphing. */
export function auraContour(frame: number, strength: number): string {
  const time = ((frame % 8) / 8) * Math.PI * 2;
  const points = Array.from({ length: 121 }, (_, index) => {
    const x = index * 7.5;
    let height = 10;
    for (let plume = 0; plume < 10; plume++) {
      const phase = auraRandom(plume * 7) * Math.PI * 2;
      const speed = 1 + Math.floor(auraRandom(plume * 7 + 1) * 3);
      const center = plume * 100 - 20 + auraRandom(plume * 7 + 2) * 48 + Math.sin(time * speed + phase) * 22;
      const width = 28 + auraRandom(plume * 7 + 3) * 44;
      const peak = (24 + auraRandom(plume * 7 + 4) * 47) * (0.8 + Math.sin(time * (4 - speed) + phase) * 0.2);
      height += peak * Math.exp(-(((x - center) / width) ** 2));
    }
    height += Math.sin(x * 0.08 + time * 2) * 2;
    return [x, Math.max(20, 158 - height * strength)];
  });
  let path = 'M0 180';
  for (const [x, y] of points) path += `L${x.toFixed(1)} ${y.toFixed(1)}`;
  return `${path}L900 180Z`;
}
