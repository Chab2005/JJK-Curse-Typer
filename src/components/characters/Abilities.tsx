import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import BevelFrame from '@/components/shared/BevelFrame';
import type { CharacterId } from '@/components/shared/characters';
import { CHARACTER_ABILITIES, hasAbilities, type AbilityKey, type CharacterAbility } from './characterAbilities';
import { CHARACTER_STYLES } from './characterStyles';
import { ABILITY_SPRITES, shikigamiStyle, type ShikigamiScene } from './abilitySprites';

const FOOTER = 'font-label-code mt-auto flex flex-wrap justify-between gap-x-4 gap-y-1 whitespace-nowrap border-t border-dashed pt-3 text-[11px] uppercase tracking-[0.14em] text-outline';

// Capacités de la technique d'un personnage, sous sa fiche : une carte par capacité (effet, durée, coût),
// la carte mise en avant seule et centrée sur la dernière rangée. Rien pour un personnage sans capacités.
export default function Abilities({ character }: { character: CharacterId }) {
  const t = useTranslations('Character.abilities');
  const techniques = useTranslations('Characters.techniques');
  if (!hasAbilities(character)) return null;
  const abilities = CHARACTER_ABILITIES[character];
  // Trois colonnes à partir de trois cartes ordinaires ; sinon deux, la carte mise en avant centrée dessous.
  const wide = abilities.filter((ability) => !ability.featured).length > 2;

  const duration = (ability: CharacterAbility) => t(`durations.${ability.duration}`, { seconds: ability.seconds ?? 0, maxSeconds: ability.maxSeconds ?? 0, words: ability.words ?? 0 });
  const cost = (ability: CharacterAbility) => t(ability.spendsAll ? 'costAll' : 'costValue', { cost: ability.cost });

  return (
    <section aria-labelledby="abilities-title" className="mt-9 flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex flex-col gap-2">
          <p className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary-container">{t('eyebrow')}</p>
          <h2 id="abilities-title" className="font-grotesk text-[32px] leading-[1.1] font-bold uppercase tracking-[0.02em] text-on-primary-container">
            {techniques(character)} · <span className={CHARACTER_STYLES[character].ink}>{t(`${character}.title`)}</span>
          </h2>
        </div>
        <p className="max-w-[460px] text-[15px] leading-[23px] text-on-surface-variant">{t(`${character}.intro`)}</p>
      </div>

      {/* Deux cartes ordinaires se partagent la largeur à parts égales ; au-delà, trois colonnes. */}
      <ul className={`grid gap-4 sm:grid-cols-2 ${wide ? 'lg:grid-cols-3' : ''}`}>
        {abilities.map((ability, index) => {
          const scene = ABILITY_SPRITES[ability.id];
          const key = `${character}.items.${ability.id}` as AbilityKey;
          const heading = (
            <div>
              <div className="flex items-baseline gap-3">
                <span className="font-label-code text-[12px] tracking-[0.16em] text-primary-container">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="font-grotesk text-[19px] font-semibold text-on-primary-container">{t(`${key}.name`)}</h3>
              </div>
              <p className="mt-3 text-[15px] leading-[23px] text-on-surface-variant">{t(`${key}.effect`)}</p>
              {ability.requires && (
                <p className="font-label-code mt-3 text-[11px] uppercase tracking-[0.14em] text-outline">
                  {t('requires')}{' '}
                  <b className="font-medium text-primary">{ability.requires.map((id) => t(`${`${character}.items.${id}` as AbilityKey}.name`)).join(' → ')}</b>
                </p>
              )}
            </div>
          );
          const footer = (
            <p className={`${FOOTER} ${ability.featured ? 'border-outline-variant' : 'border-surface-container-high'}`}>
              <span>{t('duration')} <b className="font-medium text-on-surface">{duration(ability)}</b></span>
              <span>{t('cost')} <b className={`font-medium ${ability.featured ? 'text-primary' : 'text-secondary'}`}>{cost(ability)}</b></span>
            </p>
          );
          return (
            <li
              key={ability.id}
              className={`group/card relative ${ability.featured ? (wide ? 'sm:col-span-2 lg:col-span-3 lg:w-[calc(53.333%-4px)] lg:justify-self-center' : 'sm:col-span-2 sm:w-[calc(50%-8px)] sm:justify-self-center') : ''}`}
            >
              <BevelFrame
                frame={`h-full ${ability.featured ? 'bg-linear-160 from-primary-container to-[#8f1022]' : 'bg-surface-container-high'}`}
                className={`flex h-full gap-3 px-[22px] py-5 ${scene?.beside ? 'flex-row' : 'flex-col'} ${ability.featured ? 'bg-[radial-gradient(120%_140%_at_50%_0%,#2a0a10,#131315_70%)]' : 'bg-surface'}`}
              >
                {scene?.beside ? (
                  // Shikigami à côté : le texte et le pied de carte en colonne à gauche, le shikigami seul sur toute la hauteur à droite.
                  <>
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                      {heading}
                      {footer}
                    </div>
                    <div className="shrink-0" style={{ width: scene.width, minHeight: scene.height }} />
                  </>
                ) : (
                  <>
                    {/* Place du shikigami dans le coin haut droit : le titre et l'effet s'écoulent autour. */}
                    <div className="flow-root">
                      {scene && <div className="float-right mb-2 ml-3" style={{ width: scene.width, height: scene.height }} />}
                      {heading}
                    </div>
                    {footer}
                  </>
                )}
              </BevelFrame>
              {scene && <ShikigamiCorner scene={scene} />}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Shikigami d'une carte : idle en boucle, et sa bande de survol (course, langue…) quand on passe sur la carte, comme le sprite de la fiche.
 *  `invisible` plutôt que `hidden` : la bande de survol est chargée d'avance et ne clignote pas au premier survol.
 *  Posé sur la place réservée dans la carte (bordure 1px + marges intérieures), mais hors de la carte : son biseau
 *  (clip-path) couperait la langue du crapaud, qui déborde de la carte. `pointer-events-none` : ce qui déborde
 *  ne déclenche pas le survol, seule la carte le fait. */
function ShikigamiCorner({ scene }: { scene: ShikigamiScene }) {
  return (
    <div
      aria-hidden="true"
      data-testid="shikigami"
      className={`pointer-events-none absolute right-[23px] z-10 ${scene.beside ? 'top-1/2 -translate-y-1/2' : 'top-[21px]'}`}
      style={{ width: scene.width, height: scene.height }}>
      {scene.sprites.map((sprite, i) => (
        <Fragment key={i}>
          <div className={`absolute [image-rendering:pixelated] motion-reduce:animate-none! ${sprite.hover ? 'group-hover/card:invisible motion-reduce:group-hover/card:visible' : ''}`} style={shikigamiStyle(sprite.idle, sprite, scene.scale)} />
          {sprite.hover && <div className="invisible absolute [image-rendering:pixelated] group-hover/card:visible motion-reduce:hidden" style={shikigamiStyle(sprite.hover, sprite, scene.scale)} />}
        </Fragment>
      ))}
    </div>
  );
}
