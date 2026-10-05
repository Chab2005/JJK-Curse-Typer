'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Avatar from '@/components/shared/Avatar';
import EditProfileDialog, { type EditableProfile } from './EditProfileDialog';
import ProfileLinks from './ProfileLinks';

// Avatar, pseudo et liens du joueur ; le bouton ⋯ n'apparaît que sur son propre profil.
// En attendant l'API, une modification ne vit que dans cette page.
export default function ProfileHeader({ profile, own, summary }: { profile: EditableProfile; own: boolean; summary: string }) {
  const t = useTranslations('Profile');
  const [current, setCurrent] = useState(profile);
  const [saved, setSaved] = useState(false);

  return (
    <section aria-labelledby="profile-title" className="flex flex-wrap items-start gap-x-8 gap-y-5">
      <Avatar avatar={current.avatar} name={current.username} size={148} className="ring-2 ring-primary-container ring-offset-4 ring-offset-surface" />

      <div className="flex min-w-0 flex-1 basis-60 flex-col gap-2 pt-2">
        <p className="font-label-code text-[12px] font-bold uppercase tracking-[0.32em] text-primary-container">{t('eyebrow')}</p>
        <h1 id="profile-title" className="font-grotesk text-[clamp(30px,4vw,42px)] leading-tight font-semibold break-words">{current.username}</h1>
        <ProfileLinks github={current.github} discord={current.discord} />
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
