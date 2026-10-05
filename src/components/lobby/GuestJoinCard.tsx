'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { setGuestNameAction } from '@/app/actions/auth';
import { useRouter } from '@/i18n/navigation';
import { USERNAME_MAX, USERNAME_MIN, validateUsername } from '@/lib/auth/validation';

// Visiteur sans compte ni pseudo arrivé par un lien : il choisit un pseudo d'invité (AUTH-1), puis la page
// se recharge et le fait entrer dans le lobby, lien d'invitation compris.
export default function GuestJoinCard() {
  const t = useTranslations('Lobby.guest');
  const tName = useTranslations('JoinForm');
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState<'length' | 'characters' | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const invalid = validateUsername(name) ?? (await setGuestNameAction(name.trim()));
      if (invalid === 'length' || invalid === 'characters') {
        setError(invalid);
        return;
      }
      setError(null);
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} aria-labelledby="guest-join-title" className="flex flex-col gap-3 border-l-[3px] border-primary bg-surface-container-low px-5 py-4">
      <h2 id="guest-join-title" className="text-[15px] uppercase tracking-[0.14em] text-on-surface">{t('title')}</h2>
      <p className="text-[14px] leading-5 text-on-surface-variant">{t('text')}</p>
      <label htmlFor="guest-join-name" className="text-[13px] uppercase tracking-[0.14em] text-on-surface-variant">{tName('nameLabel')}</label>
      <input
        id="guest-join-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={USERNAME_MAX}
        autoComplete="nickname"
        aria-invalid={error !== null}
        aria-describedby="guest-join-error"
        className="font-grotesk h-11 w-full border border-surface-container-highest bg-surface-container-lowest px-3 text-[16px] text-on-surface aria-invalid:border-error focus:border-primary-container focus:outline-none"
      />
      {/* Ligne réservée : l'erreur n'agrandit pas la carte. */}
      <p id="guest-join-error" role="alert" className="min-h-5 text-[13px] leading-5 text-error">
        {error && tName(`nameError.${error}`, { min: USERNAME_MIN, max: USERNAME_MAX })}
      </p>
      <button
        type="submit"
        disabled={pending}
        className="flex min-h-11 items-center justify-center gap-2 border border-on-surface px-4 text-[13px] uppercase tracking-[0.12em] transition-colors hover:bg-on-surface hover:text-surface-container-lowest disabled:pointer-events-none disabled:text-outline"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[18px]">login</span>
        {t('submit')}
      </button>
    </form>
  );
}
