'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { ENERGY_MAX } from '@/game/energy';
import { DEMO_START, nextEnergyDemo } from './energySimulation';

/** Durée d'un pas de la démonstration (une frappe simulée). */
const TICK_MS = 70;
/** Chance qu'une frappe simulée soit une faute. */
const MISS_CHANCE = 0.04;
/** Énergie affichée, immobile, quand l'utilisateur demande moins d'animations (UI-7). */
const STILL_ENERGY = 900;

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const subscribeToMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener?.('change', onChange);
  return () => query.removeEventListener?.('change', onChange);
};
const prefersReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;

// Barre d'énergie occulte du guide (BON-1) : elle se remplit au rythme d'une frappe simulée, en feu bleu,
// puis repart de zéro. La valeur est écrite en toutes lettres (UI-8).
export default function EnergyDemo() {
  const t = useTranslations('Guide.charge');
  const format = useFormatter();
  const reducedMotion = useSyncExternalStore(subscribeToMotion, prefersReducedMotion, () => false);
  const [simulated, setSimulated] = useState(DEMO_START);
  const demo = reducedMotion ? { ...DEMO_START, energy: STILL_ENERGY } : simulated;

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setInterval(() => setSimulated((state) => nextEnergyDemo(state, Math.random() < MISS_CHANCE)), TICK_MS);
    return () => clearInterval(timer);
  }, [reducedMotion]);

  const full = demo.energy >= ENERGY_MAX;
  const width = `${(demo.energy / ENERGY_MAX) * 100}%`;
  const status = full ? t('status.full') : demo.streak >= 20 ? t('status.streak', { count: demo.streak }) : t('status.charging');

  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-label-code text-[12px] uppercase tracking-[0.2em] text-outline">{t('label')}</span>
        <span className="font-label-code text-[14px] text-tertiary">
          <b className="font-label-code font-bold text-on-tertiary-container">{format.number(demo.energy)}</b> {t('max', { max: ENERGY_MAX })}
        </span>
      </div>
      <div aria-hidden="true" className={`ce ${full ? 'ce-full' : ''}`}>
        <div className="ce-track">
          <div className="ce-body" style={{ width }} />
        </div>
        <div className="ce-fires" style={{ width }}>
          <div className="ce-fire">
            <div className="ce-flames ce-glow" />
            <div className="ce-flames ce-back" />
            <div className="ce-flames" />
          </div>
          <div className="ce-fire ce-fire-mid">
            <div className="ce-flames ce-mid" />
          </div>
        </div>
        <div className="ce-ticks" />
      </div>
      <p className={`font-label-code text-[12px] uppercase tracking-[0.16em] ${full ? 'text-tertiary-fixed' : 'text-outline'}`}>{status}</p>
    </>
  );
}
