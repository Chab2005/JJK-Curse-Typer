import { readdirSync } from 'node:fs';
import path from 'node:path';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import ChevronButton from '@/components/shared/ChevronButton';
import { Link } from '@/i18n/navigation';
import { faceFrame, findCharacterImage } from '@/components/shared/characterImages';
import { CHARACTERS, type CharacterId } from '@/components/shared/characters';
import { RUNNER_IDLE, RUNNER_RUN, runnerIdleStyle, runnerStyle } from '@/components/characters/characterSprites';

// Illustration en pied du personnage : public/images/characters/<id>.webp (ou .png, .jpg…),
// agrandie et cadrée sur le visage (`face`, en fractions de l'illustration).
// Sans image, la carte affiche l'initiale en contour sur un halo coloré.
/** Hauteur, depuis le haut de la carte, où l'on pose le centre du visage. */
const FACE_ANCHOR_Y = 150;

const CHARACTERS_DIR = path.join(process.cwd(), 'public', 'images', 'characters');

function characterFiles(): string[] {
  try {
    return readdirSync(CHARACTERS_DIR);
  } catch {
    return [];
  }
}

// Personnages mis en avant sur l'accueil, dans l'ordre d'affichage.
const FEATURED: readonly CharacterId[] = ['yuji', 'megumi', 'sukuna', 'gojo'];
const FEATURED_CHARACTERS = FEATURED.map((id) => CHARACTERS.find((character) => character.id === id)!);

// Couleurs propres aux cartes de l'accueil.
const CARD_STYLES: Record<CharacterId, { tint: string; ink: string; stroke: string }> = {
  yuji: { tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,rgb(225_29_72/0.55),#131315_75%)]', ink: 'text-primary', stroke: '[-webkit-text-stroke:2px_#ffb3b6]' },
  megumi: { tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,rgb(49_49_192/0.6),#131315_75%)]', ink: 'text-secondary', stroke: '[-webkit-text-stroke:2px_#c0c1ff]' },
  nobara: { tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,rgb(147_0_10/0.6),#131315_75%)]', ink: 'text-primary-fixed', stroke: '[-webkit-text-stroke:2px_#ffdada]' },
  gojo: { tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,rgb(0_127_149/0.55),#131315_75%)]', ink: 'text-tertiary-fixed', stroke: '[-webkit-text-stroke:2px_#acedff]' },
  maki: { tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,rgb(92_63_64/0.75),#131315_75%)]', ink: 'text-on-surface-variant', stroke: '[-webkit-text-stroke:2px_#e5bdbe]' },
  yuta: { tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,rgb(0_127_149/0.4),#131315_75%)]', ink: 'text-tertiary', stroke: '[-webkit-text-stroke:2px_#4cd7f6]' },
  todo: { tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,rgb(225_29_72/0.35),#131315_75%)]', ink: 'text-primary', stroke: '[-webkit-text-stroke:2px_#ffb3b6]' },
  sukuna: { tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,rgb(147_0_10/0.7),#131315_75%)]', ink: 'text-primary', stroke: '[-webkit-text-stroke:2px_#ffb3b6]' },
};

export default function Characters() {
  const t = useTranslations('Characters');
  const files = characterFiles();

  return (
    <section aria-labelledby="characters-title" className="relative overflow-hidden bg-surface-container-lowest px-6 pt-25 pb-[110px]">
      {/* Calé sur la colonne du contenu (même gouttière et largeur max) pour s'aligner sur le titre. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-6 top-7.5 mx-auto hidden max-w-[1240px] lg:block">
        <p className="text-stroke-ghost whitespace-nowrap text-[200px] uppercase leading-none">{t('watermark')}</p>
      </div>

      <div className="relative mx-auto flex max-w-[1240px] flex-col gap-10">
        <div className="flex flex-col gap-2">
          <p className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary-container">{t('eyebrow')}</p>
          <h2 id="characters-title" className="text-[clamp(36px,4.5vw,56px)] leading-tight uppercase tracking-[0.08em]">{t('title')}</h2>
        </div>

        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-[18px]">
          {FEATURED_CHARACTERS.map((character) => {
            const image = findCharacterImage(character.id, files);
            const style = CARD_STYLES[character.id];
            return (
              // Carte F du canvas : biseau à double filet (cadre, vide, filet, face) ; au survol seulement,
              // le cadre s'allume, la carte luit en rouge et monte de 6px.
              <li
                key={character.id}
                className="group relative h-[340px] transition-[translate,filter] duration-200 hover:-translate-y-1.5 hover:brightness-115 hover:drop-shadow-[0_0_14px_rgb(225_29_72/0.45)] motion-reduce:transition-none"
              >
                <div className="bevel-var size-full bg-[#8f1022] p-px transition-colors duration-200 [--b:14px] group-hover:bg-primary-container">
                  <div className="bevel-var size-full bg-[#0b0405] p-[3px] [--b:13.5px]">
                    <div className="bevel-var size-full bg-primary-container/40 p-px [--b:12px]">
                      <div className={`bevel-var relative size-full overflow-hidden [--b:11.5px] ${style.tint}`}>
                        {image ? (
                          <Image
                            src={image}
                            alt=""
                            width={904}
                            height={1270}
                            unoptimized
                            style={{ ...faceFrame(character.face, FACE_ANCHOR_Y), transformOrigin: `${character.face.x * 100}% ${character.face.y * 100}%` }}
                            className="absolute h-auto max-w-none transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <span aria-hidden="true" className={`absolute right-3.5 -top-2.5 text-[230px] leading-none text-transparent opacity-75 ${style.stroke}`}>
                            {character.name[0]}
                          </span>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-linear-to-b from-transparent to-surface-container-lowest/95 to-55% pt-10 pr-[94px] pb-4 pl-[18px]">
                          <p className="font-grotesk text-xl font-semibold text-on-primary-container">{character.name}</p>
                          <p className={`text-[15px] ${style.ink}`}>{t(`techniques.${character.id}`)}</p>
                        </div>
                        <div aria-hidden="true" className="cut-asym absolute right-3.5 bottom-3.5 bg-primary-container p-px [--b:10px]">
                          <div className="cut-asym relative h-[67px] w-[70px] overflow-hidden bg-[rgb(12_3_4/0.85)] [--b:9.5px]">
                            <span className={`absolute bottom-0 left-1/2 block -translate-x-1/2 motion-reduce:[animation:none]! ${RUNNER_IDLE}`} style={runnerIdleStyle(character.id)} />
                            <span className={`absolute right-[3px] bottom-0 motion-reduce:[animation:none]! ${RUNNER_RUN}`} style={runnerStyle(character.id)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <ChevronButton as={Link} href="/characters" frame="self-center" className="text-sm uppercase tracking-[0.16em] whitespace-nowrap">
          {t('cta')}
        </ChevronButton>
      </div>
    </section>
  );
}
