import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

// Code de lobby inconnu (faute de frappe, lobby fermé ou lien privé invalidé, LOB-4) :
// renvoie vers le formulaire de code de l'accueil.
export default function LobbyNotFound() {
  const t = useTranslations('Lobby.notFound');

  return (
    <section aria-labelledby="lobby-not-found-title" className="relative mx-auto flex max-w-[720px] flex-col items-center gap-5 px-6 pt-24 pb-32 text-center">
      <p aria-hidden="true" className="text-stroke-ghost pointer-events-none absolute top-8 text-[180px] leading-none sm:text-[220px]">404</p>
      <p className="font-label-code relative text-[12px] font-bold uppercase tracking-[0.32em] text-primary-container">{t('eyebrow')}</p>
      <h1 id="lobby-not-found-title" className="relative text-[clamp(34px,4.5vw,56px)] leading-tight uppercase tracking-[0.08em]">{t('title')}</h1>
      <p className="relative max-w-[520px] text-lg leading-7 text-on-surface-variant">{t('text')}</p>
      <Link href="/#join" className="group bevel relative mt-3 flex bg-linear-135 from-gold to-gold-deep p-px transition-transform hover:-translate-y-0.5">
        <span className="bevel flex min-h-14 items-center gap-3 bg-primary-container px-8 text-[17px] uppercase tracking-[0.12em] text-on-primary-container transition-colors group-hover:bg-inverse-primary">
          <span aria-hidden="true" className="material-symbols-outlined text-[22px]">keyboard</span>
          {t('back')}
        </span>
      </Link>
    </section>
  );
}
