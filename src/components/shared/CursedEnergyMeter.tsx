import type { CSSProperties } from 'react';
import { ENERGY_MAX, ENERGY_SECTIONS, sectionFill } from '@/game/energy';
import type { CharacterId } from './characters';
import { auraContour, auraRandom } from './energyAura';

const SECTIONS = Array.from({ length: ENERGY_SECTIONS }, (_, i) => i);
const SHAPE = auraContour(0, 1);
const FRAMES = Object.fromEntries(Array.from({ length: 8 }, (_, frame) => [`--ce-shape-${frame}`, `path("${auraContour(frame, 1)}")`]));
// Detached, ink-edged pools rather than repeated fire icons (BON-1).
const FRAGMENTS = Array.from({ length: 14 }, (_, i) => ({
  left: `${2 + auraRandom(i + 100) * 96}%`,
  width: `${10 + auraRandom(i + 200) * 20}px`,
  height: `${7 + auraRandom(i + 300) * 12}px`,
  '--delay': `${-auraRandom(i + 400) * 10}s`,
  '--duration': `${2 + auraRandom(i + 500) * 3}s`,
  '--drift': `${auraRandom(i + 600) * 54 - 27}px`,
}));

/** BON-1 / UI-8: ink silhouettes, luminous pools and floating fragments, shared by race and guide. */
export default function CursedEnergyMeter({ energy, label, valueText, compact = false, character }: {
  energy: number;
  label: string;
  valueText: string;
  compact?: boolean;
  character?: CharacterId | null;
}) {
  const amount = Math.max(0, Math.min(ENERGY_MAX, energy));
  const state = amount === 0 ? 'empty' : amount === ENERGY_MAX ? 'full' : 'charging';
  const affinity = character === 'sukuna' ? 'sukuna' : character === 'yuta' ? 'yuta' : 'default';

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={ENERGY_MAX}
      aria-valuenow={amount}
      aria-valuetext={valueText}
      className={`ce ${compact ? 'ce-compact' : ''}`}
      data-state={state}
      data-affinity={affinity}
      style={{ ...FRAMES, '--ce-level': amount / ENERGY_MAX, '--ce-fill': `${amount / ENERGY_MAX * 100}%` } as CSSProperties}
    >
      <div aria-hidden="true" className="ce-bar">
        <div className="ce-track" />
        <div className="ce-fill">
          <div className="ce-body" />
          <div className="ce-current" />
        </div>
      </div>
      <div aria-hidden="true" className="ce-charge">
        <div className="ce-field">
          <svg className="ce-surface" viewBox="0 0 900 180" preserveAspectRatio="none">
            <path className="ce-skin" d={SHAPE} />
            <path className="ce-light" d={SHAPE} transform="translate(0 180) scale(1 0.75) translate(0 -180)" />
            <path className="ce-hot" d={SHAPE} transform="translate(0 180) scale(1 0.38) translate(0 -180)" />
          </svg>
          <div className="ce-fragments">
            {FRAGMENTS.map((style, i) => (
              <svg key={i} className="ce-fragment" style={style as CSSProperties} viewBox="0 0 40 30" preserveAspectRatio="none">
                <path d="M4 18 C-3 8 11 7 12 2 C19 5 25 -2 29 6 C38 7 32 14 38 18 C33 22 29 18 25 26 C17 23 11 31 8 23Z" />
              </svg>
            ))}
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="ce-ticks">
        {SECTIONS.map((index) => <span key={index} data-section={index} data-fill={sectionFill(amount, index)} />)}
      </div>
    </div>
  );
}
