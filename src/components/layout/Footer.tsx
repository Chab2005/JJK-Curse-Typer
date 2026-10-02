import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="flex w-full flex-col items-center gap-[22px] border-t border-surface-container-low bg-black px-margin pt-14 pb-9 text-center">
      <p className="flex items-center gap-3.5">
        <span className="bevel bg-linear-135 from-gold to-gold-deep p-px">
          <span className="bevel flex items-center bg-black px-3.5 py-2">
            <span className="bg-linear-to-b from-[#fff1b8] via-gold to-gold-deep bg-clip-text text-base uppercase tracking-[0.12em] text-transparent">Jujutsu Kaisen</span>
          </span>
        </span>
        <span className="text-[22px] tracking-[0.06em]">
          Curse <span className="text-primary">Typer</span>
        </span>
      </p>
      <nav aria-label={t('nav')} className="flex flex-wrap justify-center gap-7">
        <FooterLink href="/lobbies">{t('arenas')}</FooterLink>
        <FooterLink href="/leaderboard">{t('leaderboard')}</FooterLink>
        <FooterLink href="/profile">{t('profile')}</FooterLink>
      </nav>
      <p className="max-w-[640px] text-[13px] leading-5 text-outline">{t('disclaimer')}</p>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="py-1.5 text-[13px] uppercase tracking-[0.16em] text-on-surface-variant transition-colors hover:text-on-primary-container">
      {children}
    </Link>
  );
}
