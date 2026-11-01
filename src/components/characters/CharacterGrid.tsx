import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { faceFrame } from '@/components/shared/characterImages';
import { CHARACTERS } from '@/components/shared/characters';
import { CHARACTER_STYLES } from './characterStyles';
import { RUNNER_IDLE, RUNNER_RUN, runnerIdleStyle, runnerStyle } from './characterSprites';

/** Largeur de l'illustration dans la carte : le buste entier, pas seulement le visage. */
const ART_WIDTH = 500;
/** Hauteur, depuis le haut de la carte, où l'on pose le centre du visage. */
const FACE_ANCHOR_Y = 120;

// Grille des huit exorcistes : chaque carte ouvre la fiche /characters/<id>.
// Même carte que l'accueil (carte F du canvas) : biseau à double filet (cadre, vide, filet, face) ; au survol,
// le cadre s'allume, la carte luit en rouge, monte de 6px et l'illustration s'agrandit.
export default function CharacterGrid() {
  const t = useTranslations('CharactersPage');
  const techniques = useTranslations('Characters.techniques');

  return (
    <ul aria-label={t('listLabel')} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-[18px]">
      {CHARACTERS.map((character) => {
        const technique = techniques(character.id);
        return (
          <li key={character.id}>
            <Link
              href={`/characters/${character.id}`}
              aria-label={t('cardLabel', { name: character.name, technique })}
              className="group block transition-[translate,filter] duration-200 hover:-translate-y-1.5 hover:brightness-115 hover:drop-shadow-[0_0_14px_rgb(225_29_72/0.45)] motion-reduce:transition-none"
            >
              <span className="bevel-var block bg-[#8f1022] p-px transition-colors duration-200 [--b:14px] group-hover:bg-primary-container">
                <span className="bevel-var block bg-[#0b0405] p-[3px] [--b:13.5px]">
                  <span className="bevel-var block bg-primary-container/40 p-px [--b:12px]">
                    <span className={`bevel-var relative block h-[300px] overflow-hidden [--b:11.5px] sm:h-[360px] ${CHARACTER_STYLES[character.id].tint}`}>
                      <Image
                        src={`/images/characters/${character.id}.webp`}
                        alt=""
                        width={904}
                        height={1270}
                        unoptimized
                        style={{ ...faceFrame(character.face, FACE_ANCHOR_Y, ART_WIDTH), transformOrigin: `${character.face.x * 100}% ${character.face.y * 100}%` }}
                        className="absolute h-auto max-w-none transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-linear-to-b from-transparent to-surface-container-lowest/95 to-55% px-4 pt-12 pb-4 xl:pr-[94px] xl:pl-[18px]">
                        <span className="font-grotesk text-lg font-semibold text-on-primary-container sm:text-xl">{character.name}</span>
                        <span className={`text-[15px] ${CHARACTER_STYLES[character.id].ink}`}>{technique}</span>
                      </span>
                      <span aria-hidden="true" className="cut-asym absolute right-3.5 bottom-3.5 hidden bg-primary-container p-px [--b:10px] xl:block">
                        <span className="cut-asym relative block h-[67px] w-[70px] overflow-hidden bg-[rgb(12_3_4/0.85)] [--b:9.5px]">
                          <span className={`absolute bottom-0 left-1/2 block -translate-x-1/2 motion-reduce:[animation:none]! ${RUNNER_IDLE}`} style={runnerIdleStyle(character.id)} />
                          <span className={`absolute right-[3px] bottom-0 motion-reduce:[animation:none]! ${RUNNER_RUN}`} style={runnerStyle(character.id)} />
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
