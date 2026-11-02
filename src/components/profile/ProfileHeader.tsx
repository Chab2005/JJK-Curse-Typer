'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import EditProfileDialog, { type EditableProfile } from './EditProfileDialog';
import ProfileIdentity from './ProfileIdentity';
import ProfileLinks from './ProfileLinks';

// Avatar, pseudo et liens du joueur ; le bouton « Modifier le profil » n'apparaît que sur son propre profil.
// En attendant l'API, une modification ne vit que dans cette page.
export default function ProfileHeader({ profile, own, summary }: { profile: EditableProfile; own: boolean; summary: string }) {
  const t = useTranslations('Profile');
  const [current, setCurrent] = useState(profile);
  const [saved, setSaved] = useState(false);

  return (
    <ProfileIdentity
      name={current.username}
      avatar={current.avatar}
      summary={summary}
      action={
        own && (
          <EditProfileDialog
            profile={current}
            onSave={(next) => {
              setCurrent(next);
              setSaved(true);
            }}
          />
        )
      }
    >
      <ProfileLinks github={current.github} discord={current.discord} />
      <p role="status" className="min-h-5 text-[14px] leading-5 text-tertiary">{saved ? t('edit.saved') : ''}</p>
    </ProfileIdentity>
  );
}
