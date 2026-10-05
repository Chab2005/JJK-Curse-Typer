import { useTranslations } from 'next-intl';
import { DiscordIcon, GithubIcon } from '@/components/profile/BrandIcons';

// Lancent le flux OAuth (AUTH-4) : navigation complète vers la route d'API, pas un lien interne de l'application.
export default function OAuthButtons({ verb }: { verb: 'login' | 'register' }) {
  const t = useTranslations('Auth');
  const providers = [
    { id: 'discord', name: 'Discord', Icon: DiscordIcon },
    { id: 'github', name: 'GitHub', Icon: GithubIcon },
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      <p className="font-label-code flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-outline before:h-px before:flex-1 before:bg-surface-container-highest after:h-px after:flex-1 after:bg-surface-container-highest">
        {t('or')}
      </p>
      {providers.map(({ id, name, Icon }) => (
        <a
          key={id}
          href={`/api/auth/${id}`}
          className="flex min-h-13 items-center justify-center gap-3 border border-surface-container-highest bg-surface-container-lowest text-[15px] uppercase tracking-[0.12em] text-on-surface transition-colors hover:border-primary hover:text-primary"
        >
          <Icon className="size-5" />
          {t(`oauth.${verb}`, { provider: name })}
        </a>
      ))}
    </div>
  );
}
