'use client';

import { useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';
import type { AuthState } from '@/app/actions/auth';
import ChevronButton from '@/components/shared/ChevronButton';
import { PASSWORD_MAX, PASSWORD_MIN, USERNAME_MAX, USERNAME_MIN } from '@/lib/auth/validation';

export type AuthMode = 'login' | 'register' | 'oauth';

/** Plaque pointée du champ : son filet s'allume au focus et passe en erreur avec le champ. */
const FIELD = 'hx-cut flex bg-[#8f1022] p-px transition-colors [--h:14px] focus-within:bg-primary-container has-aria-invalid:bg-error';
const FIELD_FACE = 'hx-cut flex min-h-[54px] w-full items-center bg-[radial-gradient(120%_160%_at_50%_0%,#2a0b10_0%,#170608_55%,#0c0304_100%)] [--h:13.5px]';
const INPUT = 'font-grotesk h-[54px] min-w-0 flex-1 bg-transparent px-[30px] text-[18px] text-on-primary-container focus:outline-none';
const LABEL = 'flex items-baseline justify-between gap-3 text-[13px] uppercase tracking-[0.14em] text-on-surface-variant';
const HINT = 'font-label-code text-[10px] tracking-[0.08em] text-outline';

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
    <form action={formAction} className="flex flex-col gap-[18px]">
      <div className="flex flex-col gap-2">
        <label htmlFor="auth-username" className={LABEL}>
          {t('username')}
          {creating && <span className={HINT}>{t('usernameHint', { min: USERNAME_MIN, max: USERNAME_MAX })}</span>}
        </label>
        <span className={FIELD}>
          <span className={FIELD_FACE}>
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
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="auth-password" className={LABEL}>
          {t('password')}
          {creating && <span className={HINT}>{t('passwordHint', { min: PASSWORD_MIN })}</span>}
        </label>
        <span className={FIELD}>
          <span className={FIELD_FACE}>
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
              className={INPUT}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              aria-pressed={showPassword}
              className="mr-[18px] flex size-11 shrink-0 items-center justify-center text-outline transition-colors hover:text-primary"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-[22px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </span>
        </span>
      </div>

      {creating && (
        // AUTH-6 : pas de récupération de mot de passe, il faut le dire avant la création.
        <div className="bevel-var flex bg-[#4a1218] p-px [--b:10px]">
          <p className="bevel-var flex flex-1 gap-3 bg-[#120506] px-4 py-3 text-[15px] leading-[22px] text-on-surface-variant [--b:9.5px]">
            <span aria-hidden="true" className="material-symbols-outlined text-[20px] text-primary">warning</span>
            {t('lossWarning')}
          </p>
        </div>
      )}

      {/* Zone réservée : l'apparition d'une erreur ne doit pas décaler le formulaire. */}
      <p id="auth-error" role="alert" className="min-h-[22px] text-[15px] leading-[22px] text-error">
        {error ? t(`errors.${error}`, { min: USERNAME_MIN, max: USERNAME_MAX, passwordMin: PASSWORD_MIN }) : ''}
      </p>

      <ChevronButton type="submit" variant="primary" disabled={pending} frame="w-full disabled:pointer-events-none disabled:opacity-80" className="gap-3 text-[18px] uppercase tracking-[0.12em]">
        <span aria-hidden="true" className={`material-symbols-outlined text-[20px] ${pending ? 'animate-spin' : ''}`}>{pending ? 'progress_activity' : mode === 'login' ? 'login' : 'person_add'}</span>
        {t(`submit.${mode}`)}
      </ChevronButton>
    </form>
  );
}
