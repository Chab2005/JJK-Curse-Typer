'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

// Données de démonstration : les libellés sont traduits, le nom du salon est choisi par l'hôte.
type LobbyMode = { kind: 'sprint'; seconds: number } | { kind: 'words'; count: number };
type LobbyBadge = { kind: 'seconds'; seconds: number } | { kind: 'words'; count: number } | { kind: 'standard' };
type LobbyParticipants = { kind: 'exorcists' | 'ready'; current: number; max: number };
type LobbyStatus = { kind: 'startsIn'; seconds: number } | { kind: 'waitingSquad' } | { kind: 'readyToLaunch' };

interface LobbyItem {
  id: string;
  name: string;
  mode: LobbyMode;
  badge: LobbyBadge;
  participants: LobbyParticipants;
  status: LobbyStatus;
  statusColor: 'primary' | 'secondary' | 'tertiary';
  joinCode: string;
}

const LOBBIES: LobbyItem[] = [
  {
    id: '1',
    name: 'Shinjuku Showdown',
    mode: { kind: 'sprint', seconds: 60 },
    badge: { kind: 'seconds', seconds: 60 },
    participants: { kind: 'exorcists', current: 7, max: 8 },
    status: { kind: 'startsIn', seconds: 12 },
    statusColor: 'primary',
    joinCode: 'SHINJUKU-60',
  },
  {
    id: '2',
    name: 'Sanctuaire Maudit',
    mode: { kind: 'words', count: 120 },
    badge: { kind: 'words', count: 120 },
    participants: { kind: 'ready', current: 3, max: 5 },
    status: { kind: 'waitingSquad' },
    statusColor: 'secondary',
    joinCode: 'SANCTUARY-BF',
  },
  {
    id: '3',
    name: 'Novices de Kyoto',
    mode: { kind: 'words', count: 30 },
    badge: { kind: 'standard' },
    participants: { kind: 'ready', current: 2, max: 4 },
    status: { kind: 'readyToLaunch' },
    statusColor: 'tertiary',
    joinCode: 'KYOTO-30W',
  },
];

export default function PublicLobbies() {
  const t = useTranslations('PublicLobbies');
  const [activeExorcists, setActiveExorcists] = useState(342);

  const handleQuickJoin = (code: string) => {
    const pinInput = document.getElementById('roomPinInput') as HTMLInputElement;
    if (pinInput) {
      pinInput.value = code;
      const form = pinInput.closest('form') as HTMLFormElement;
      if (form) form.dispatchEvent(new Event('submit', { bubbles: true }));
    }
  };

  const refreshLobbies = () => {
    const base = 330;
    const add = Math.floor(Math.random() * 30);
    setActiveExorcists(base + add);
  };

  return (
    <div className="lg:col-span-5 flex flex-col gap-space-md">
      <div className="bg-surface-container rounded-xl p-space-md flex flex-col gap-space-md shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-[20px] text-secondary">meeting_room</span>
            <span className="font-headline-sm text-headline-sm text-on-surface uppercase">{t('title')}</span>
          </div>
          <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-tertiary font-label-code text-talisman-tag uppercase">
            {t('open')}
          </span>
        </div>

        <div className="flex flex-col gap-space-sm">
          {LOBBIES.map((lobby) => (
            <LobbyCard
              key={lobby.id}
              lobby={lobby}
              onJoin={() => handleQuickJoin(lobby.joinCode)}
            />
          ))}
        </div>

        <div className="pt-space-xs flex items-center justify-between font-label-code text-talisman-tag text-outline">
          <span>{t('activeExorcists', { count: activeExorcists })}</span>
          <button
            onClick={refreshLobbies}
            className="hover:text-on-surface flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">sync</span>
            <span>{t('refresh')}</span>
          </button>
        </div>

        <Link
          href="#"
          className="w-full py-space-sm px-space-md rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 hover:border-primary/50 text-on-surface hover:text-primary transition-all flex items-center justify-center gap-space-sm font-headline-sm text-label-code uppercase tracking-wider group shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px] text-primary group-hover:translate-x-0.5 transition-transform">
            explore
          </span>
          <span>{t('explore')}</span>
          <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary transition-colors">
            arrow_forward
          </span>
        </Link>
      </div>
    </div>
  );
}

function LobbyCard({ lobby, onJoin }: { lobby: LobbyItem; onJoin: () => void }) {
  const t = useTranslations('PublicLobbies');

  const colorMap = {
    primary: 'group-hover:text-primary',
    secondary: 'group-hover:text-secondary',
    tertiary: 'group-hover:text-tertiary',
  };

  const bgColorMap = {
    primary: 'hover:bg-primary-container hover:text-on-primary-container',
    secondary: 'hover:bg-secondary-container hover:text-on-primary-container',
    tertiary: 'hover:bg-tertiary-container hover:text-on-primary-container',
  };

  const badgeColorMap = {
    primary: 'bg-primary-container/20 text-primary',
    secondary: 'bg-secondary-container/30 text-secondary',
    tertiary: 'bg-tertiary-container/30 text-tertiary',
  };

  const groupIconColorMap = {
    primary: 'text-tertiary',
    secondary: 'text-secondary',
    tertiary: 'text-outline',
  };

  return (
    <div className="group bg-surface-container-low hover:bg-surface-container-high rounded-lg p-space-sm transition-all flex flex-col gap-space-xs">
      <div className="flex items-start justify-between gap-space-xs">
        <div>
          <h2 className={`font-headline-sm text-headline-sm text-on-surface transition-colors ${colorMap[lobby.statusColor]}`}>
            {lobby.name}
          </h2>
          <span className="font-label-code text-talisman-tag text-outline">{t(`mode.${lobby.mode.kind}`, lobby.mode)}</span>
        </div>
        <span className={`px-space-xs py-0.5 rounded font-label-code text-talisman-tag font-bold ${badgeColorMap[lobby.statusColor]}`}>
          {t(`badge.${lobby.badge.kind}`, lobby.badge)}
        </span>
      </div>

      <div className="flex items-center justify-between pt-space-xs">
        <div className="flex items-center gap-space-xs text-on-surface-variant font-label-code text-label-code">
          <span className={`material-symbols-outlined text-[16px] ${groupIconColorMap[lobby.statusColor]}`}>
            group
          </span>
          <span>{t(`participants.${lobby.participants.kind}`, lobby.participants)}</span>
          <span className="text-primary font-bold">{t(`status.${lobby.status.kind}`, lobby.status)}</span>
        </div>
        <button
          onClick={onJoin}
          className={`px-space-sm py-1 bg-surface-container-highest text-on-surface rounded font-headline-sm text-label-code uppercase transition-colors ${bgColorMap[lobby.statusColor]}`}
        >
          {t('join')}
        </button>
      </div>
    </div>
  );
}
