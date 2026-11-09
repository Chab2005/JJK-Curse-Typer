import Image from 'next/image';
import { useTranslations } from 'next-intl';

// Logo et nom du site, en tête de page (Header, en-tête de course) : empilés comme dans le hero,
// mais serrés pour que l'en-tête garde sa hauteur.
export default function Brand() {
  const t = useTranslations('Brand');

  return (
    <span className="flex flex-col items-center gap-0.5">
      <span className="relative block w-[130px] sm:w-[150px]">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-[8%] -inset-y-[30%] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgb(245_215_122/0.28),transparent_72%)] blur-[4px]"
        />
        <Image
          src="/images/jjk-logo.png"
          alt={t('logoAlt')}
          width={1164}
          height={271}
          sizes="150px"
          priority
          className="relative h-auto w-full [filter:drop-shadow(0_0_1px_#f5d77a)_drop-shadow(0_0_2px_#c9972f)]"
        />
      </span>
      <span className="text-[13px] leading-none uppercase tracking-[0.22em] whitespace-nowrap text-primary [text-shadow:0_0_12px_rgb(225_29_72/0.7)] sm:text-[15px]">
        Curse Typer
      </span>
    </span>
  );
}
