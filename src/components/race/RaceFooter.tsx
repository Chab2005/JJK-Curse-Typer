import { useTranslations } from 'next-intl';

// Pied de page de la course (maquette « Course ») : très sobre, un dégradé de la couleur du site jusqu'au noir.
export default function RaceFooter() {
  const t = useTranslations('Race');

  return (
    <footer className="w-full bg-linear-to-b from-surface via-[rgb(147_0_10/0.16)] to-black px-margin pt-28 pb-8 text-center">
      <p className="text-[12px] uppercase tracking-[0.22em] text-outline">{t('footer')}</p>
    </footer>
  );
}
