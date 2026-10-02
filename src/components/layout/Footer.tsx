import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="flex w-full flex-col items-center gap-[22px] border-t border-surface-container-low bg-black px-margin pt-14 pb-9 text-center">
      <p className="flex items-center gap-3.5">
        <span className="relative block w-[200px]">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-[8%] -inset-y-[30%] bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,rgb(245_215_122/0.3),transparent_72%)] blur-[4px]"
          />
          <Image
            src="/images/jjk-logo.png"
            alt="Jujutsu Kaisen"
            width={1164}
            height={271}
            sizes="200px"
            className="relative h-auto w-full [filter:drop-shadow(0_0_1px_#f5d77a)_drop-shadow(0_0_2px_#c9972f)]"
          />
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
