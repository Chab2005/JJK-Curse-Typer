import type { CSSProperties, ReactNode } from 'react';
import { spriteStyle } from './characterSprites';
import styles from './GojoDomain.module.css';

/** Tunnel violet (BON-6, UI-4), inspiré de « Gojo-domain-expansion » d'arisrad.
 * 288 rayons répartis autour du trou noir, dont un tiers se déplacent en continu.
 */
const FOCUS = { x: 200, y: 110 };
const RAYS = Array.from({ length: 288 }, (_, index) => {
  const angle = (index / 288) * Math.PI * 2 + Math.sin(index * 19) * .004;
  const reach = 300 + (index % 7) * 13;
  return {
    x: FOCUS.x + Math.cos(angle) * reach,
    y: FOCUS.y + Math.sin(angle) * reach,
  };
});

/** Fond partagé par le territoire de Gojo et la démonstration d'immunité de Maki. */
export function DomainScene({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true" className={styles.scene}>
      <svg className={styles.tunnel} viewBox="0 0 400 220" fill="none" preserveAspectRatio="none">
        <g className={styles.rays}>
          {RAYS.map(({ x, y }, index) => {
            const path = `M${FOCUS.x} ${FOCUS.y}L${x.toFixed(2)} ${y.toFixed(2)}`;
            const pink = index % 4 === 0;
            return (
              <g key={index} style={{ '--delay': `${-index * .113}s`, '--duration': `${2.5 + (index % 9) * .2}s` } as CSSProperties}>
                <path d={path} stroke={pink ? '#d96bbd' : '#ad7eed'} strokeWidth={index % 5 === 0 ? .75 : .35} opacity={index % 3 === 0 ? .4 : .2} />
                {index % 3 === 0 && <path className={styles.streak} d={path} pathLength="100" stroke={pink ? '#ffc3ef' : '#e2caff'} strokeWidth={index % 6 === 0 ? 1.3 : .55} />}
              </g>
            );
          })}
        </g>
      </svg>
      <span className={styles.blackHole} />
      {children}
    </div>
  );
}

export default function GojoDomain() {
  return (
    <DomainScene>
      <span className={styles.aura} />
      <span className={styles.gojo}>
        <span className="block motion-reduce:[animation:none]!" style={spriteStyle('gojo', 'idle', 0.3)} />
      </span>
    </DomainScene>
  );
}
