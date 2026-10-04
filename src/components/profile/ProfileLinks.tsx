import { useTranslations } from 'next-intl';
import { DiscordIcon, GithubIcon } from './BrandIcons';
import { discordHref, githubHandle } from './profileEdit';

// Liens GitHub et Discord d'un profil ; ne rend rien s'il n'y en a aucun.
export default function ProfileLinks({ github, discord }: { github: string; discord: string }) {
  const t = useTranslations('Profile');
  const handle = githubHandle(github);
  const discordLink = discordHref(discord);
  if (!handle && !discord) return null;

  return (
    <ul className="flex flex-col gap-1">
      {handle && (
        <li>
          <a href={github} target="_blank" rel="noreferrer" className="font-label-code inline-flex min-h-8 items-center gap-2 text-[14px] text-primary hover:text-primary-fixed">
            <GithubIcon className="size-[18px]" />
            {t('github', { handle })}
          </a>
        </li>
      )}
      {discord && (
        <li className="font-label-code inline-flex min-h-8 items-center gap-2 text-[14px] text-secondary">
          <DiscordIcon className="size-[18px]" />
          {discordLink ? (
            <a href={discordLink} target="_blank" rel="noreferrer" className="font-label-code text-secondary hover:text-secondary-fixed">{t('discordLink')}</a>
          ) : (
            <span className="font-label-code">{t('discord', { name: discord })}</span>
          )}
        </li>
      )}
    </ul>
  );
}
