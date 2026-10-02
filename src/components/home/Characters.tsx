import { readdirSync } from 'node:fs';
import path from 'node:path';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { faceFrame, findCharacterImage } from '@/components/shared/characterImages';
import { CHARACTERS, type CharacterId } from '@/components/shared/characters';

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

// Couleurs propres aux cartes de l'accueil.
const CARD_STYLES: Record<CharacterId, { tint: string; ink: string; stroke: string }> = {
  yuji: { tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,rgb(225_29_72/0.55),#131315_75%)]', ink: 'text-primary', stroke: '[-webkit-text-stroke:2px_#ffb3b6]' },
  megumi: { tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,rgb(49_49_192/0.6),#131315_75%)]', ink: 'text-secondary', stroke: '[-webkit-text-stroke:2px_#c0c1ff]' },
  nobara: { tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,rgb(147_0_10/0.6),#131315_75%)]', ink: 'text-primary-fixed', stroke: '[-webkit-text-stroke:2px_#ffdada]' },
  gojo: { tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,rgb(0_127_149/0.55),#131315_75%)]', ink: 'text-tertiary-fixed', stroke: '[-webkit-text-stroke:2px_#acedff]' },
  maki: { tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,rgb(92_63_64/0.75),#131315_75%)]', ink: 'text-on-surface-variant', stroke: '[-webkit-text-stroke:2px_#e5bdbe]' },
  nanami: { tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,rgb(0_127_149/0.4),#131315_75%)]', ink: 'text-tertiary', stroke: '[-webkit-text-stroke:2px_#4cd7f6]' },
  todo: { tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,rgb(225_29_72/0.35),#131315_75%)]', ink: 'text-primary', stroke: '[-webkit-text-stroke:2px_#ffb3b6]' },
  toge: { tint: 'bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,rgb(49_49_192/0.45),#131315_75%)]', ink: 'text-secondary', stroke: '[-webkit-text-stroke:2px_#c0c1ff]' },
};

export default function Characters() {
  const t = useTranslations('Characters');
  const files = characterFiles();

  return (
    <section aria-labelledby="characters-title" className="relative overflow-hidden bg-surface-container-lowest px-6 pt-25 pb-[110px]">
      <p aria-hidden="true" className="text-stroke-ghost pointer-events-none absolute -left-2.5 top-7.5 hidden whitespace-nowrap text-[200px] uppercase leading-none lg:block">
        {t('watermark')}
      </p>

      <div className="relative mx-auto flex max-w-[1240px] flex-col gap-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="flex flex-col gap-2">
            <p className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary-container">{t('eyebrow')}</p>
            <h2 id="characters-title" className="text-[clamp(36px,4.5vw,56px)] leading-tight uppercase tracking-[0.08em]">{t('title')}</h2>
          </div>
          <Link
            href="/lobbies"
            className="flex min-h-12 items-center gap-2.5 border border-on-surface px-[22px] text-sm uppercase tracking-[0.16em] text-on-surface transition-colors hover:bg-on-surface hover:text-surface-container-lowest"
          >
            {t('cta')}
            <span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
        </div>

        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-[18px]">
          {CHARACTERS.map((character, index) => {
            const image = findCharacterImage(character.id, files);
            const style = CARD_STYLES[character.id];
            return (
              <li
                key={character.id}
                className={`group relative h-[340px] overflow-hidden shadow-[0_0_0_1px_#2a2a2c,0_16px_28px_rgb(0_0_0/0.5)] transition duration-200 hover:-translate-y-1.5 hover:shadow-[0_0_0_1px_#ffb3b6,0_24px_40px_rgb(0_0_0/0.6)] ${style.tint}`}
              >
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
                <p className="font-label-code absolute left-[18px] top-[18px] bg-surface-container-lowest/70 px-1.5 py-0.5 text-[11px] tracking-[0.2em] text-on-surface-variant">
                  {t('number', { number: String(index + 1).padStart(2, '0') })}
                </p>
                <div className="absolute inset-x-0 bottom-0 bg-linear-to-b from-transparent to-surface-container-lowest/95 to-55% px-[18px] pt-10 pb-4">
                  <p className="font-grotesk text-xl font-semibold text-on-primary-container">{character.name}</p>
                  <p className={`text-[15px] ${style.ink}`}>{t(`techniques.${character.id}`)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
