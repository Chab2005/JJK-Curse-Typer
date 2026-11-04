import { useTranslations } from 'next-intl';
import { DiscordIcon, GithubIcon } from '@/components/profile/BrandIcons';
import ChevronButton from '@/components/shared/ChevronButton';

// Lancent le flux OAuth (AUTH-4) : navigation complète vers la route d'API, pas un lien interne de l'application.
export default function OAuthButtons({ verb }: { verb: 'login' | 'register' }) {
  const t = useTranslations('Auth');
  const providers = [
    { id: 'discord', name: 'Discord', Icon: DiscordIcon },
    { id: 'github', name: 'GitHub', Icon: GithubIcon },
  ] as const;

  return (
    <div className="flex flex-col gap-2.5">
      <p className="font-label-code flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-outline before:h-px before:flex-1 before:bg-[#8f1022]/60 after:h-px after:flex-1 after:bg-[#8f1022]/60">
        {t('or')}
      </p>
      {providers.map(({ id, name, Icon }) => (
        <ChevronButton key={id} as="a" href={`/api/auth/${id}`} size="sm" chevrons={false} frame="w-full" className="font-label-code text-[11px] uppercase tracking-[0.12em] whitespace-nowrap">
          <Icon className="size-[18px] shrink-0" />
          {t(`oauth.${verb}`, { provider: name })}
        </ChevronButton>
      ))}
    </div>
  );
}
