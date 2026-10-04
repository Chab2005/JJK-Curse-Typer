'use client';

import { useTranslations } from 'next-intl';
import { useActionState, useRef, useState } from 'react';
import { removeAvatarAction, updateDisplayNameAction, uploadAvatarAction, type ProfileState } from '@/app/actions/auth';
import Avatar from '@/components/shared/Avatar';
import { AVATAR_MAX_BYTES } from '@/lib/auth/avatar';
import { DISPLAY_NAME_MAX } from '@/lib/auth/validation';

const BUTTON =
  'min-h-12 border border-surface-container-highest px-5 text-[14px] uppercase tracking-[0.12em] text-on-surface transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-60';

// Photo de profil (PROF-5) : JPEG, PNG ou WebP, 2 Mo au plus ; le serveur la recadre et la redimensionne.
export function AvatarForm({ username, displayName, avatarUrl }: { username: string; displayName: string; avatarUrl: string | null }) {
  const t = useTranslations('Settings');
  const [state, action, pending] = useActionState(uploadAvatarAction, null as ProfileState);
  const [tooBig, setTooBig] = useState(false);
  const [removing, setRemoving] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const error = tooBig ? 'avatarSize' : state?.error;

  return (
    <section aria-labelledby="avatar-title" className="flex flex-wrap items-center gap-6">
      <Avatar avatar={null} name={displayName || username} src={avatarUrl} size={120} className="ring-2 ring-primary-container ring-offset-4 ring-offset-surface" />
      <form action={action} className="flex min-w-0 flex-1 basis-60 flex-col gap-3">
        <h2 id="avatar-title" className="text-[13px] uppercase tracking-[0.14em] text-on-surface-variant">{t('avatar.title')}</h2>
        <input
          ref={input}
          id="avatar-file"
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          aria-label={t('avatar.choose')}
          aria-describedby="avatar-hint avatar-error"
          onChange={(e) => setTooBig((e.target.files?.[0]?.size ?? 0) > AVATAR_MAX_BYTES)}
          className="font-label-code text-[13px] text-on-surface-variant file:mr-4 file:min-h-10 file:border file:border-surface-container-highest file:bg-surface-container-lowest file:px-4 file:text-on-surface"
        />
        <p id="avatar-hint" className="text-[13px] text-outline">{t('avatar.hint')}</p>
        <p id="avatar-error" role="alert" className="min-h-[22px] text-[14px] text-error">{error ? t(`errors.${error}`) : ''}</p>
        <p role="status" className="min-h-[22px] text-[14px] text-tertiary">{state?.ok && !tooBig ? t('saved') : ''}</p>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={pending || tooBig} className={BUTTON}>{t('avatar.upload')}</button>
          {avatarUrl && (
            <button
              type="button"
              disabled={removing}
              onClick={async () => {
                setRemoving(true);
                await removeAvatarAction();
                setRemoving(false);
                window.location.reload();
              }}
              className={BUTTON}
            >
              {t('avatar.remove')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

// Nom affiché (PROF-3) : celui du profil et des courses ; l'identifiant de connexion ne change pas.
export function DisplayNameForm({ username, displayName }: { username: string; displayName: string }) {
  const t = useTranslations('Settings');
  const [state, action, pending] = useActionState(updateDisplayNameAction, null as ProfileState);

  return (
    <form action={action} className="flex flex-col gap-2">
      <label htmlFor="display-name" className="text-[13px] uppercase tracking-[0.14em] text-on-surface-variant">{t('displayName.label')}</label>
      <input
        id="display-name"
        name="displayName"
        type="text"
        required
        maxLength={DISPLAY_NAME_MAX}
        defaultValue={displayName}
        aria-invalid={state?.error === 'displayName'}
        aria-describedby="display-name-hint display-name-error"
        className="font-grotesk min-h-13 w-full border border-surface-container-highest bg-surface-container-lowest px-4 text-xl text-on-surface focus:border-primary-container focus:outline-none aria-invalid:border-error"
      />
      <p id="display-name-hint" className="text-[13px] text-outline">{t('displayName.hint', { username })}</p>
      <p id="display-name-error" role="alert" className="min-h-[22px] text-[14px] text-error">{state?.error ? t(`errors.${state.error}`) : ''}</p>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={BUTTON}>{t('displayName.save')}</button>
        <p role="status" className="text-[14px] text-tertiary">{state?.ok ? t('saved') : ''}</p>
      </div>
    </form>
  );
}
