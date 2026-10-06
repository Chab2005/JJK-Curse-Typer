import { useTranslations } from 'next-intl';
import BevelFrame, { goldFrame } from '@/components/shared/BevelFrame';
import { Link } from '@/i18n/navigation';

export type NotFoundVariant = 'page' | 'profile' | 'settings' | 'lobby';

// Où renvoyer le visiteur selon ce qui manque : l'accueil, le classement, les paramètres ou le formulaire de code.
const BACK: Record<NotFoundVariant, { href: string; icon: string }> = {
  page: { href: '/', icon: 'home' },
  profile: { href: '/leaderboard', icon: 'leaderboard' },
  settings: { href: '/settings', icon: 'settings' },
  lobby: { href: '/#join', icon: 'keyboard' },
};

// Contenu des pages 404 : URL inconnue, joueur inexistant, sous-page de paramètres inconnue,
// code de lobby inconnu (faute de frappe, lobby fermé ou lien privé invalidé, LOB-4).
export default function NotFound({ variant }: { variant: NotFoundVariant }) {
  const t = useTranslations('NotFound');
  const back = BACK[variant];

  return (
    <section aria-labelledby="not-found-title" className="relative mx-auto flex max-w-[720px] flex-col items-center gap-5 px-6 pt-24 pb-32 text-center">
      <p aria-hidden="true" className="text-stroke-ghost pointer-events-none absolute top-8 text-[180px] leading-none sm:text-[220px]">404</p>
      <p className="font-label-code relative text-[12px] font-bold uppercase tracking-[0.32em] text-primary-container">{t(`${variant}.eyebrow`)}</p>
      <h1 id="not-found-title" className="relative text-[clamp(34px,4.5vw,56px)] leading-tight uppercase tracking-[0.08em]">{t(`${variant}.title`)}</h1>
      <p className="relative max-w-[520px] text-lg leading-7 text-on-surface-variant">{t(`${variant}.text`)}</p>
      <BevelFrame
        as={Link}
        href={back.href}
        frame={`group relative mt-3 flex ${goldFrame} transition-transform hover:-translate-y-0.5`}
        className="flex min-h-14 items-center gap-3 bg-primary-container px-8 text-[17px] uppercase tracking-[0.12em] text-on-primary-container transition-colors group-hover:bg-inverse-primary"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[22px]">{back.icon}</span>
        {t(`${variant}.back`)}
      </BevelFrame>
    </section>
  );
}
