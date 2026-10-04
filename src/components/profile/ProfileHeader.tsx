'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Avatar from '@/components/shared/Avatar';
import EditProfileDialog, { type EditableProfile } from './EditProfileDialog';
import { DiscordIcon, GithubIcon } from './BrandIcons';
import { discordHref, githubHandle } from './profileEdit';

// Avatar, pseudo et liens du joueur ; le bouton ⋯ n'apparaît que sur son propre profil.
// En attendant l'API, une modification ne vit que dans cette page.
export default function ProfileHeader({ profile, own, summary }: { profile: EditableProfile; own: boolean; summary: string }) {
  const t = useTranslations('Profile');
  const [current, setCurrent] = useState(profile);
  const [saved, setSaved] = useState(false);
  const github = githubHandle(current.github);
  const discordLink = discordHref(current.discord);

  return (
    <section aria-labelledby="profile-title" className="flex flex-wrap items-start gap-x-8 gap-y-5">
      <Avatar avatar={current.avatar} name={current.username} size={148} className="ring-2 ring-primary-container ring-offset-4 ring-offset-surface" />

      <div className="flex min-w-0 flex-1 basis-60 flex-col gap-2 pt-2">
        <p className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary-container">{t('eyebrow')}</p>
        <h1 id="profile-title" className="font-grotesk text-[clamp(30px,4vw,42px)] leading-tight font-semibold break-words">{current.username}</h1>
        <ul className="flex flex-col gap-1">
          {github && (
            <li>
              <a href={current.github} target="_blank" rel="noreferrer" className="font-label-code inline-flex min-h-8 items-center gap-2 text-[14px] text-primary hover:text-primary-fixed">
                <GithubIcon className="size-[18px]" />
                {t('github', { handle: github })}
              </a>
            </li>
          )}
          {current.discord && (
            <li className="font-label-code inline-flex min-h-8 items-center gap-2 text-[14px] text-secondary">
              <DiscordIcon className="size-[18px]" />
              {discordLink ? (
                <a href={discordLink} target="_blank" rel="noreferrer" className="font-label-code text-secondary hover:text-secondary-fixed">{t('discordLink')}</a>
              ) : (
                <span className="font-label-code">{t('discord', { name: current.discord })}</span>
              )}
            </li>
          )}
        </ul>
        <p className="font-label-code text-[12px] text-outline">{summary}</p>
        <p role="status" className="text-[14px] text-tertiary">{saved ? t('edit.saved') : ''}</p>
      </div>

      {own && (
        <EditProfileDialog
          profile={current}
          onSave={(next) => {
            setCurrent(next);
            setSaved(true);
          }}
        />
      )}
    </section>
  );
}
