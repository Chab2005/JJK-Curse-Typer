'use client';

import { useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';
import type { AuthState } from '@/app/actions/auth';
import BevelFrame from '@/components/shared/BevelFrame';
import { PASSWORD_MAX, PASSWORD_MIN, USERNAME_MAX, USERNAME_MIN } from '@/lib/auth/validation';

export type AuthMode = 'login' | 'register' | 'oauth';

const INPUT =
  'font-grotesk min-h-13 w-full border border-surface-container-highest bg-surface-container-lowest px-4 text-xl text-on-surface placeholder:text-surface-container-highest focus:border-primary-container focus:outline-none aria-invalid:border-error';

// Formulaire partagé par la connexion, l'inscription (AUTH-2) et le choix du pseudo après un premier accès OAuth (AUTH-4).
export default function AuthForm({
  mode,
  action,
}: {
  mode: AuthMode;
  action: (prev: AuthState, form: FormData) => Promise<AuthState>;
}) {
  const t = useTranslations('Auth');
  const [state, formAction, pending] = useActionState(action, null);
  const [showPassword, setShowPassword] = useState(false);
  const creating = mode !== 'login';
  const error = state?.error;
  const usernameInvalid = error === 'username' || error === 'usernameChars' || error === 'taken';
  const passwordInvalid = error === 'password';

  return (
    <form action={formAction} className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-2">
        <label htmlFor="auth-username" className="flex justify-between text-[13px] uppercase tracking-[0.14em] text-on-surface-variant">
          {t('username')}
          {creating && <span className="font-label-code text-[10px] tracking-[0.08em] text-outline">{t('usernameHint', { min: USERNAME_MIN, max: USERNAME_MAX })}</span>}
        </label>
        <input
          id="auth-username"
          name="username"
          type="text"
          required
          minLength={creating ? USERNAME_MIN : undefined}
          maxLength={creating ? USERNAME_MAX : 64}
          pattern={creating ? '[A-Za-z0-9_\\-]+' : undefined}
          defaultValue={state?.username ?? ''}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={usernameInvalid}
          aria-describedby={usernameInvalid ? 'auth-error' : undefined}
          className={INPUT}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="auth-password" className="flex justify-between text-[13px] uppercase tracking-[0.14em] text-on-surface-variant">
          {t('password')}
          {creating && <span className="font-label-code text-[10px] tracking-[0.08em] text-outline">{t('passwordHint', { min: PASSWORD_MIN })}</span>}
        </label>
        <div className="relative flex items-center">
          <input
            id="auth-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={creating ? PASSWORD_MIN : undefined}
            maxLength={PASSWORD_MAX}
            autoComplete={creating ? 'new-password' : 'current-password'}
            aria-invalid={passwordInvalid}
            aria-describedby={passwordInvalid ? 'auth-error' : undefined}
            className={`${INPUT} pr-13`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? t('hidePassword') : t('showPassword')}
            aria-pressed={showPassword}
            className="absolute right-0 flex size-13 items-center justify-center text-outline transition-colors hover:text-primary"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[22px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
          </button>
        </div>
      </div>

      {creating && (
        // AUTH-6 : pas de récupération de mot de passe, il faut le dire avant la création.
        <p className="flex gap-3 border-l-2 border-primary-container bg-surface-container-lowest p-3 text-[14px] text-on-surface-variant">
          <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-primary">warning</span>
          {t('lossWarning')}
        </p>
      )}

      {/* Zone réservée : l'apparition d'une erreur ne doit pas décaler le formulaire. */}
      <p id="auth-error" role="alert" className="min-h-[22px] text-[14px] text-error">
        {error ? t(`errors.${error}`, { min: USERNAME_MIN, max: USERNAME_MAX, passwordMin: PASSWORD_MIN }) : ''}
      </p>

      <BevelFrame
        as="button"
        type="submit"
        disabled={pending}
        frame="group flex bg-primary transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-80"
        className="flex min-h-15 flex-grow items-center justify-center gap-3 bg-primary-container text-[19px] uppercase tracking-[0.12em] text-on-primary-container transition-colors group-hover:bg-inverse-primary"
      >
        <span aria-hidden="true" className={`material-symbols-outlined text-[22px] ${pending ? 'animate-spin' : ''}`}>{pending ? 'progress_activity' : mode === 'login' ? 'login' : 'person_add'}</span>
        {t(`submit.${mode}`)}
      </BevelFrame>
    </form>
  );
}
