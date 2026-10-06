'use client';

import { useTranslations } from 'next-intl';
import { useActionState, useRef, useState } from 'react';
import { saveSettingsAction, type SettingsState } from '@/app/actions/auth';
import Avatar from '@/components/shared/Avatar';
import { githubHandle } from '@/components/profile/profileEdit';
import { AVATAR_MAX_BYTES } from '@/lib/auth/avatar';
import { DISPLAY_NAME_MAX } from '@/lib/auth/validation';

const BUTTON =
  'min-h-12 border border-surface-container-highest px-5 text-[14px] uppercase tracking-[0.12em] text-on-surface transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-60';
const LABEL = 'text-[13px] uppercase tracking-[0.14em] text-on-surface-variant';
const ERROR = 'min-h-[22px] text-[14px] text-error';
const LINK_INPUT =
  'font-label-code min-h-13 w-full border border-surface-container-highest bg-surface-container-lowest px-4 text-[15px] text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none aria-invalid:border-error';

interface Props {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  github: string;
  discord: string;
}

// Paramètres du compte (PROF-3, PROF-4, PROF-5) : photo, nom affiché et liens, enregistrés d'un seul bouton qui renvoie au profil.
// La photo choisie (ou son retrait) n'est appliquée qu'à l'enregistrement.
export default function SettingsForm({ username, displayName, avatarUrl, github, discord }: Props) {
  const t = useTranslations('Settings');
  const [preview, setPreview] = useState<string | null>(null);
  const [tooBig, setTooBig] = useState(false);
  const [removing, setRemoving] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState(async (prev: SettingsState, form: FormData) => {
    const next = await saveSettingsAction(prev, form);
    // En cas d'erreur, React vide le formulaire, donc aussi le fichier choisi.
    setPreview(null);
    return next;
  }, null);
  const errors = state?.errors ?? {};
  const values = state?.values;
  const avatarError = tooBig ? 'avatarSize' : errors.avatar;
  const shownAvatar = preview ?? (removing ? null : avatarUrl);

  const pickFile = (file: File | undefined) => {
    setTooBig((file?.size ?? 0) > AVATAR_MAX_BYTES);
    setPreview(file ? URL.createObjectURL(file) : null);
    if (file) setRemoving(false);
  };

  return (
    <form action={action} className="flex flex-col gap-10">
      <section aria-labelledby="avatar-title" className="flex flex-wrap items-center gap-6">
        <Avatar avatar={null} name={displayName || username} src={shownAvatar} size={120} className="ring-2 ring-primary-container ring-offset-4 ring-offset-surface" />
        <div className="flex min-w-0 flex-1 basis-60 flex-col gap-3">
          <h2 id="avatar-title" className={LABEL}>{t('avatar.title')}</h2>
          <input
            ref={input}
            id="avatar-file"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label={t('avatar.choose')}
            aria-describedby="avatar-hint avatar-error"
            onChange={(e) => pickFile(e.target.files?.[0])}
            className="font-label-code text-[13px] text-on-surface-variant file:mr-4 file:min-h-10 file:border file:border-surface-container-highest file:bg-surface-container-lowest file:px-4 file:text-on-surface"
          />
          <p id="avatar-hint" className="text-[13px] text-outline">{t('avatar.hint')}</p>
          <p id="avatar-error" role="alert" className={ERROR}>{avatarError ? t(`errors.${avatarError}`) : ''}</p>
          {removing && <input type="hidden" name="removeAvatar" value="1" />}
          {(avatarUrl || preview) && (
            <div>
              <button
                type="button"
                onClick={() => {
                  // Retire d'abord la photo choisie ; sinon marque la photo actuelle à retirer (ou annule).
                  if (!preview) return setRemoving(!removing);
                  if (input.current) input.current.value = '';
                  pickFile(undefined);
                }}
                className={BUTTON}
              >
                {removing ? t('avatar.keep') : t('avatar.remove')}
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-2">
        <label htmlFor="display-name" className={LABEL}>{t('displayName.label')}</label>
        <input
          id="display-name"
          name="displayName"
          type="text"
          required
          maxLength={DISPLAY_NAME_MAX}
          defaultValue={values?.displayName ?? displayName}
          aria-invalid={!!errors.displayName}
          aria-describedby="display-name-hint display-name-error"
          className="font-grotesk min-h-13 w-full border border-surface-container-highest bg-surface-container-lowest px-4 text-xl text-on-surface focus:border-primary-container focus:outline-none aria-invalid:border-error"
        />
        <p id="display-name-hint" className="text-[13px] text-outline">{t('displayName.hint', { username })}</p>
        <p id="display-name-error" role="alert" className={ERROR}>{errors.displayName ? t(`errors.${errors.displayName}`) : ''}</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="link-github" className={LABEL}>{t('links.github')}</label>
          <input id="link-github" name="github" type="text" defaultValue={values?.github ?? githubHandle(github) ?? github} placeholder={t('links.githubPlaceholder')} spellCheck={false} aria-invalid={!!errors.github} aria-describedby="link-github-error" className={LINK_INPUT} />
          <p id="link-github-error" role="alert" className={ERROR}>{errors.github ? t(`errors.${errors.github}`) : ''}</p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="link-discord" className={LABEL}>{t('links.discord')}</label>
          <input id="link-discord" name="discord" type="text" defaultValue={values?.discord ?? discord} placeholder={t('links.discordPlaceholder')} spellCheck={false} aria-invalid={!!errors.discord} aria-describedby="link-discord-error" className={LINK_INPUT} />
          <p id="link-discord-error" role="alert" className={ERROR}>{errors.discord ? t(`errors.${errors.discord}`) : ''}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-surface-container-highest pt-8">
        {errors.auth && <p role="alert" className={ERROR}>{t('errors.auth')}</p>}
        <button type="submit" disabled={pending || tooBig} className={`${BUTTON} self-start border-primary-container text-primary-container`}>
          {pending ? t('saving') : t('save')}
        </button>
      </div>
    </form>
  );
}
