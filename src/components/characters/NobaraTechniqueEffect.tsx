import { useTranslations } from 'next-intl';
import type { ExamplePhase, NobaraExampleAbility } from './techniqueDemo';
import styles from './TechniqueExample.module.css';

/** Clous de Nobara et conséquences, sur la même piste que les coureurs (BON-1, UI-8). */
export default function NobaraTechniqueEffect({ ability, phase, reducedMotion }: {
  ability: NobaraExampleAbility;
  phase: ExamplePhase;
  reducedMotion: boolean;
}) {
  const resonance = useTranslations('Character.example.nobara.resonance');
  const hairpin = useTranslations('Character.example.nobara.hairpin');
  const after = phase === 'after';
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {ability === 'hairpin' && (
        <div key={phase} className="font-label-code absolute top-2.5 left-3 flex flex-col gap-1 text-sm text-outline">
          {hairpin('text')}
          <span className="flex gap-[1ch] whitespace-nowrap text-xl text-on-surface">
            {hairpin('sample')}
            {after && <span data-testid="hairpin-words" className={`text-fuchsia-300 ${styles.addedWords}`}>{hairpin('added')}</span>}
          </span>
        </div>
      )}
      {after && (
        <span className="font-label-code absolute top-14 right-7 text-sm text-fuchsia-300">
          {ability === 'hairpin' ? hairpin('status') : resonance('status')}
        </span>
      )}
      {phase === 'cast' && !reducedMotion && (
        <span
          data-testid="nobara-impact"
          data-ability={ability}
          className="absolute top-16 z-30 size-24 origin-center -translate-x-1/2 scale-[1.75]"
          style={{ left: 'calc(36px + 0.7 * (100% - 72px))' }}
        >
          <span className={`absolute inset-0 ${styles.impact}`} style={{ backgroundImage: `url(/images/characters/anim/techniques/straw-doll/${ability}-hover.png)` }} />
        </span>
      )}
    </div>
  );
}
