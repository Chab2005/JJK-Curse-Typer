import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import BevelFrame from '@/components/shared/BevelFrame';
import type { CharacterId } from '@/components/shared/characters';
import { CHARACTER_ABILITIES, hasAbilities, type CharacterAbility } from './characterAbilities';
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

  const duration = (ability: CharacterAbility) => t(`durations.${ability.duration}`, { seconds: ability.seconds ?? 0 });
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

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {abilities.map((ability, index) => {
          const scene = ABILITY_SPRITES[ability.id];
          return (
            <li
              key={ability.id}
              className={`group/card relative ${ability.featured ? 'sm:col-span-2 sm:w-[calc(50%-8px)] sm:justify-self-center lg:col-span-1 lg:col-start-2 lg:w-auto lg:justify-self-stretch' : ''}`}
            >
              <BevelFrame
                frame={`h-full ${ability.featured ? 'bg-linear-160 from-primary-container to-[#8f1022]' : 'bg-surface-container-high'}`}
                className={`flex h-full flex-col gap-3 px-[22px] py-5 ${ability.featured ? 'bg-[radial-gradient(120%_140%_at_50%_0%,#2a0a10,#131315_70%)]' : 'bg-surface'}`}
              >
                {/* Place du shikigami dans le coin haut droit : le titre et l'effet s'écoulent autour. */}
                <div className="flow-root">
                  {scene && <div className="float-right mb-2 ml-3" style={{ width: scene.width, height: scene.height }} />}
                  {/* `flow-root` à côté du float : la colonne de texte garde sa largeur jusqu'en bas au lieu de passer sous le shikigami. */}
                  <div className={scene?.beside ? 'flow-root' : undefined}>
                    <div className="flex items-baseline gap-3">
                      <span className="font-label-code text-[12px] tracking-[0.16em] text-primary-container">{String(index + 1).padStart(2, '0')}</span>
                      <h3 className="font-grotesk text-[19px] font-semibold text-on-primary-container">{t(`${character}.items.${ability.id}.name`)}</h3>
                    </div>
                    <p className="mt-3 text-[15px] leading-[23px] text-on-surface-variant">{t(`${character}.items.${ability.id}.effect`)}</p>
                  </div>
                </div>
                <p className={`${FOOTER} ${ability.featured ? 'border-outline-variant' : 'border-surface-container-high'}`}>
                  <span>{t('duration')} <b className="font-medium text-on-surface">{duration(ability)}</b></span>
                  <span>{t('cost')} <b className={`font-medium ${ability.featured ? 'text-primary' : 'text-secondary'}`}>{cost(ability)}</b></span>
                </p>
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
    <div aria-hidden="true" data-testid="shikigami" className="pointer-events-none absolute top-[21px] right-[23px] z-10" style={{ width: scene.width, height: scene.height }}>
      {scene.sprites.map((sprite, i) => (
        <Fragment key={i}>
          <div className={`absolute [image-rendering:pixelated] ${sprite.hover ? 'group-hover/card:invisible' : ''}`} style={shikigamiStyle(sprite.idle, sprite, scene.scale)} />
          {sprite.hover && <div className="invisible absolute [image-rendering:pixelated] group-hover/card:visible" style={shikigamiStyle(sprite.hover, sprite, scene.scale)} />}
        </Fragment>
      ))}
    </div>
  );
}
