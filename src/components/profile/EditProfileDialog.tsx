'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import Avatar from '@/components/shared/Avatar';
import BevelFrame, { cardFrame, goldFrame } from '@/components/shared/BevelFrame';
import { CHARACTERS, type CharacterId } from '@/components/shared/characters';
import { type ProfileEditErrors, normalizeGithub, validateProfileEdit } from './profileEdit';

export interface EditableProfile {
  username: string;
  avatar: CharacterId | null;
  github: string;
  discord: string;
}

// Dialogue de modification du profil (PROF-1, PROF-3) : avatar, pseudo, liens GitHub et Discord.
// <dialog> natif : focus piégé, Échap pour fermer, retour du focus sur le bouton ⋯.
export default function EditProfileDialog({ profile, onSave }: { profile: EditableProfile; onSave: (next: EditableProfile) => void }) {
  const t = useTranslations('Profile.edit');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(profile);
  const [errors, setErrors] = useState<ProfileEditErrors>({});

  const open = () => {
    setDraft(profile);
    setErrors({});
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateProfileEdit(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSave({ ...draft, username: draft.username.trim(), github: normalizeGithub(draft.github), discord: draft.discord.trim() });
    close();
  };

  return (
    <>
      <BevelFrame
        as="button"
        type="button"
        onClick={open}
        aria-label={t('open')}
        aria-haspopup="dialog"
        frame="group flex bg-outline-variant transition-colors hover:bg-primary"
        className="flex size-11 items-center justify-center bg-surface-container-lowest text-on-surface-variant transition-colors group-hover:bg-surface-container-high group-hover:text-primary"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[22px]">more_horiz</span>
      </BevelFrame>

      <dialog
        ref={dialogRef}
        aria-labelledby="edit-profile-title"
        onClick={(e) => e.target === e.currentTarget && close()}
        className="m-auto w-[min(calc(100vw-32px),560px)] max-h-[calc(100dvh-32px)] overflow-y-auto bg-transparent p-0 text-on-surface backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <BevelFrame as="form" onSubmit={submit} noValidate frame={cardFrame} className="flex flex-col gap-5 bg-surface-container-low px-6 pt-7 pb-6 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <h2 id="edit-profile-title" className="text-[24px] uppercase tracking-[0.12em]">{t('title')}</h2>
            <button type="button" onClick={close} aria-label={t('close')} className="flex size-10 items-center justify-center text-on-surface-variant transition-colors hover:text-primary">
              <span aria-hidden="true" className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          <fieldset className="flex flex-col items-center gap-3">
            <legend className="sr-only">{t('avatar')}</legend>
            <Avatar avatar={draft.avatar} name={draft.username} size={132} className="ring-2 ring-primary-container ring-offset-4 ring-offset-surface-container-low" />
            <p aria-hidden="true" className="text-[13px] uppercase tracking-[0.14em] text-on-surface-variant">{t('avatar')}</p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {CHARACTERS.map((character) => (
                <label key={character.id} className="cursor-pointer rounded-[50%] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tertiary">
                  <input
                    type="radio"
                    name="avatar"
                    checked={draft.avatar === character.id}
                    onChange={() => setDraft({ ...draft, avatar: character.id })}
                    className="sr-only"
                  />
                  <span className="sr-only">{character.name}</span>
                  <Avatar
                    avatar={character.id}
                    name={character.name}
                    size={44}
                    className={`ring-2 ring-offset-2 ring-offset-surface-container-low transition-shadow ${draft.avatar === character.id ? 'ring-primary-container' : 'ring-transparent hover:ring-outline'}`}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <Field id="edit-username" label={t('username')} error={errors.username && t(`errors.username.${errors.username}`)}>
            <input
              id="edit-username"
              value={draft.username}
              onChange={(e) => setDraft({ ...draft, username: e.target.value })}
              maxLength={20}
              autoComplete="username"
              spellCheck={false}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? 'edit-username-error' : undefined}
              className="font-grotesk min-h-13 w-full border border-surface-container-highest bg-surface-container-lowest px-4 text-xl text-on-surface focus:border-primary-container focus:outline-none aria-invalid:border-error"
            />
          </Field>

          <Field id="edit-github" label={t('github')} error={errors.github && t('errors.github')} icon="link">
            <input
              id="edit-github"
              type="url"
              value={draft.github}
              onChange={(e) => setDraft({ ...draft, github: e.target.value })}
              placeholder={t('githubPlaceholder')}
              spellCheck={false}
              aria-invalid={Boolean(errors.github)}
              aria-describedby={errors.github ? 'edit-github-error' : undefined}
              className="font-label-code min-h-13 w-full border border-surface-container-highest bg-surface-container-lowest pr-12 pl-4 text-[15px] text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none aria-invalid:border-error"
            />
          </Field>

          <Field id="edit-discord" label={t('discord')} error={errors.discord && t('errors.discord')} icon="link">
            <input
              id="edit-discord"
              value={draft.discord}
              onChange={(e) => setDraft({ ...draft, discord: e.target.value })}
              placeholder={t('discordPlaceholder')}
              spellCheck={false}
              aria-invalid={Boolean(errors.discord)}
              aria-describedby={errors.discord ? 'edit-discord-error' : undefined}
              className="font-label-code min-h-13 w-full border border-surface-container-highest bg-surface-container-lowest pr-12 pl-4 text-[15px] text-on-surface placeholder:text-outline focus:border-primary-container focus:outline-none aria-invalid:border-error"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={close}
              className="min-h-13 border border-surface-container-highest text-[15px] uppercase tracking-[0.12em] text-on-surface transition-colors hover:border-primary hover:text-primary"
            >
              {t('cancel')}
            </button>
            <BevelFrame as="button" type="submit" frame={`group flex ${goldFrame}`} className="flex min-h-[50px] flex-1 items-center justify-center gap-2 bg-primary-container text-on-primary-container transition-colors group-hover:bg-inverse-primary text-[15px] uppercase tracking-[0.12em]">
              <span aria-hidden="true" className="material-symbols-outlined text-[19px]">save</span>
              {t('save')}
            </BevelFrame>
          </div>
        </BevelFrame>
      </dialog>
    </>
  );
}

function Field({ id, label, error, icon, children }: { id: string; label: string; error?: string; icon?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[13px] uppercase tracking-[0.14em] text-on-surface-variant">{label}</label>
      <div className="relative flex items-center">
        {children}
        {icon && <span aria-hidden="true" className="material-symbols-outlined pointer-events-none absolute right-4 text-xl text-outline">{icon}</span>}
      </div>
      {error && <p id={`${id}-error`} className="text-[14px] text-error">{error}</p>}
    </div>
  );
}
