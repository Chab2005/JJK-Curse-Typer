'use client';

import { useTranslations } from 'next-intl';
import { useActionState, useRef, useState } from 'react';
import { saveSettingsAction, type SettingsState } from '@/app/actions/auth';
import { DiscordIcon, GithubIcon } from '@/components/profile/BrandIcons';
import Avatar from '@/components/shared/Avatar';
import BevelPanel from '@/components/shared/BevelPanel';
import ChevronButton from '@/components/shared/ChevronButton';
import Pointer from '@/components/shared/Pointer';
import { githubHandle } from '@/components/profile/profileEdit';
import { Link } from '@/i18n/navigation';
import { AVATAR_MAX_BYTES } from '@/lib/auth/avatar';
import { DISPLAY_NAME_MAX } from '@/lib/auth/validation';
import HexInput from './HexInput';

const LABEL = 'font-label-code text-[11px] font-bold uppercase tracking-[0.2em] text-primary-text';
const HINT = 'text-[14px] leading-5 text-outline';
const ERROR = 'min-h-5 text-[14px] leading-5 text-error';
const SMALL = 'font-label-code text-[11px] uppercase tracking-[0.16em]';
/** Les textes autour d'un champ ou d'un bouton pointé commencent où son bord droit commence, pas à sa pointe. */
const PAST_FIELD_TIP = 'pl-4';
const PAST_BUTTON_TIP = 'pl-[13px]';

interface Props {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  github: string;
  discord: string;
}

// Paramètres du compte (PROF-3, PROF-4, PROF-5) : photo, nom affiché et liens, enregistrés d'un seul bouton qui renvoie au profil.
// Style cramoisi (canvas « Paramètres · style cramoisi ») : panneaux biseautés, champs pointés, boutons-flèches.
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
    <form action={action} className="flex flex-col gap-7">
      <BevelPanel as="section" aria-labelledby="avatar-title" className="flex flex-wrap items-center gap-x-8 gap-y-6 px-6 py-7 sm:px-8">
        <span className="inline-flex shrink-0 drop-shadow-[0_0_18px_rgb(225_29_72/0.35)]">
          <span className="bevel inline-flex bg-primary-container p-0.5">
            <span className="bevel inline-flex bg-surface-container-lowest p-[3px]">
              <Avatar avatar={null} name={displayName || username} src={shownAvatar} size={120} shape="bevel" />
            </span>
          </span>
        </span>
        <div className="flex min-w-0 flex-1 basis-64 flex-col gap-2.5">
          <h2 id="avatar-title" className={`${LABEL} ${PAST_BUTTON_TIP}`}>{t('avatar.title')}</h2>
          <div className="flex flex-wrap gap-2.5">
            {/* La vraie case de fichier reste dans le bouton, masquée : le clavier et les lecteurs d'écran la trouvent. */}
            <ChevronButton as="label" size="sm" chevrons={false} frame="has-focus-visible:brightness-150" className={SMALL}>
              <input
                ref={input}
                id="avatar-file"
                name="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label={t('avatar.choose')}
                aria-describedby="avatar-hint avatar-error"
                onChange={(e) => pickFile(e.target.files?.[0])}
                className="sr-only"
              />
              <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary">upload</span>
              {t('avatar.choose')}
            </ChevronButton>
            {(avatarUrl || preview) && (
              <ChevronButton
                type="button"
                size="sm"
                chevrons={false}
                onClick={() => {
                  // Retire d'abord la photo choisie ; sinon marque la photo actuelle à retirer (ou annule).
                  if (!preview) return setRemoving(!removing);
                  if (input.current) input.current.value = '';
                  pickFile(undefined);
                }}
                className={SMALL}
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary">{removing ? 'undo' : 'delete'}</span>
                {removing ? t('avatar.keep') : t('avatar.remove')}
              </ChevronButton>
            )}
          </div>
          {removing && <input type="hidden" name="removeAvatar" value="1" />}
          <p id="avatar-hint" className={`${HINT} ${PAST_BUTTON_TIP}`}>{t('avatar.hint')}</p>
          <p id="avatar-error" role="alert" className={`${ERROR} ${PAST_BUTTON_TIP}`}>{avatarError ? t(`errors.${avatarError}`) : ''}</p>
        </div>
      </BevelPanel>

      <BevelPanel as="section" aria-labelledby="identity-title" className="flex flex-col gap-5 px-6 py-7 sm:px-8">
        <h2 id="identity-title" className="text-[22px] uppercase tracking-[0.08em]">{t('identity')}</h2>

        <div className="flex flex-col gap-2">
          <label htmlFor="display-name" className={`${LABEL} ${PAST_FIELD_TIP}`}>{t('displayName.label')}</label>
          <HexInput
            large
            id="display-name"
            name="displayName"
            type="text"
            required
            maxLength={DISPLAY_NAME_MAX}
            defaultValue={values?.displayName ?? displayName}
            aria-invalid={!!errors.displayName}
            aria-describedby="display-name-hint display-name-error"
          />
          <p id="display-name-hint" className={`${HINT} ${PAST_FIELD_TIP}`}>{t('displayName.hint', { username })}</p>
          <p id="display-name-error" role="alert" className={`${ERROR} ${PAST_FIELD_TIP}`}>{errors.displayName ? t(`errors.${errors.displayName}`) : ''}</p>
        </div>

        <div className="grid gap-x-[18px] gap-y-2 border-t border-[#8f1022]/60 pt-[18px] sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="link-github" className={`${LABEL} ${PAST_FIELD_TIP}`}>{t('links.github')}</label>
            <HexInput
              icon={<GithubIcon className="size-[18px]" />}
              id="link-github"
              name="github"
              type="text"
              defaultValue={values?.github ?? githubHandle(github) ?? github}
              placeholder={t('links.githubPlaceholder')}
              spellCheck={false}
              aria-invalid={!!errors.github}
              aria-describedby="link-github-error"
            />
            <p id="link-github-error" role="alert" className={`${ERROR} ${PAST_FIELD_TIP}`}>{errors.github ? t(`errors.${errors.github}`) : ''}</p>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <label htmlFor="link-discord" className={`${LABEL} ${PAST_FIELD_TIP}`}>{t('links.discord')}</label>
            <HexInput
              icon={<DiscordIcon className="size-[18px]" />}
              id="link-discord"
              name="discord"
              type="text"
              defaultValue={values?.discord ?? discord}
              placeholder={t('links.discordPlaceholder')}
              spellCheck={false}
              aria-invalid={!!errors.discord}
              aria-describedby="link-discord-error"
            />
            <p id="link-discord-error" role="alert" className={`${ERROR} ${PAST_FIELD_TIP}`}>{errors.discord ? t(`errors.${errors.discord}`) : ''}</p>
          </div>
        </div>
      </BevelPanel>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href={`/profile/${encodeURIComponent(username)}`} className="font-label-code flex min-h-11 items-center gap-2.5 text-[12px] uppercase tracking-[0.16em] text-on-surface-variant hover:text-on-primary-container">
          {/* La pointe est tournée vers la droite après sa rotation : la retourner à la verticale la fait pointer vers la gauche. */}
          <Pointer className="-scale-y-100 text-primary-text" />
          {t('backToProfile')}
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-4">
          {errors.auth && <p role="alert" className={ERROR}>{t('errors.auth')}</p>}
          <ChevronButton type="submit" variant="primary" disabled={pending || tooBig} frame="disabled:opacity-50" className="text-[17px] uppercase tracking-[0.12em] whitespace-nowrap">
            <span aria-hidden="true" className="material-symbols-outlined text-[20px]">save</span>
            {pending ? t('saving') : t('save')}
          </ChevronButton>
        </div>
      </div>
    </form>
  );
}
