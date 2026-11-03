import { useTranslations } from 'next-intl';
import type { ExamplePhase, YujiExampleAbility } from './techniqueDemo';
import styles from './TechniqueExample.module.css';

/** Impacts et conséquences de Yuji, sur la même piste que les coureurs (BON-1, UI-8). */
export default function YujiTechniqueEffect({ ability, phase, reducedMotion }: {
  ability: YujiExampleAbility;
  phase: ExamplePhase;
  reducedMotion: boolean;
}) {
  const t = useTranslations(`Character.example.yuji.${ability}`);
  const blackFlash = ability === 'blackFlash';
  const after = phase === 'after';
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {blackFlash ? (
        <div className="absolute top-3 left-3 flex w-40 flex-col gap-2">
          <span className="font-label-code text-sm text-primary">{t(after ? 'boost' : 'energy')}</span>
          <span className="h-2.5 overflow-hidden bg-surface-container-high">
            <span className={`block h-full bg-primary-container ${styles.energy}`} style={{ width: after ? '90%' : '30%' }} />
          </span>
        </div>
      ) : (
        <div key={phase} className="font-label-code absolute top-2.5 left-3 flex gap-5 text-sm text-outline">
          <span className="flex flex-col gap-1">{t('keys')}<span className="text-xl text-on-surface">{t('sample')}</span></span>
          <span className="flex flex-col gap-1">{t('screen')}<span className={`block overflow-hidden whitespace-nowrap text-xl text-cyan-300 ${after ? styles.delayedTyping : ''}`}>{t('sample')}</span></span>
        </div>
      )}
      {after && <span className={`font-label-code absolute top-14 right-7 text-sm ${blackFlash ? 'text-primary' : 'text-cyan-300'}`}>{t('status')}</span>}
      {phase === 'cast' && !reducedMotion && (
        <span
          data-testid="yuji-impact"
          data-ability={ability}
          className="absolute top-16 z-30 size-24 origin-center -translate-x-1/2 scale-[1.75]"
          style={{ left: 'calc(36px + 0.7 * (100% - 72px))' }}
        >
          <span className={`absolute inset-0 ${styles.impact}`} style={{ backgroundImage: `url(/images/characters/anim/techniques/yuji/${blackFlash ? 'black-flash' : 'divergent-fist'}.png)` }} />
          {!blackFlash && <span className={`absolute inset-0 ${styles.impact} ${styles.secondHit}`} style={{ backgroundImage: 'url(/images/characters/anim/techniques/yuji/divergent-fist.png)' }} />}
        </span>
      )}
    </div>
  );
}
