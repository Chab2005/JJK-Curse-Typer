'use client';

import Link from 'next/link';
import { useState } from 'react';

interface LobbyItem {
  id: string;
  name: string;
  type: string;
  duration: string;
  participants: string;
  status: string;
  statusColor: 'primary' | 'secondary' | 'tertiary';
  joinCode: string;
}

const LOBBIES: LobbyItem[] = [
  {
    id: '1',
    name: 'Shinjuku Showdown',
    type: '60s Sprint',
    duration: '60s',
    participants: '7/8 exorcistes',
    status: 'Départ dans 12s',
    statusColor: 'primary',
    joinCode: 'SHINJUKU-60',
  },
  {
    id: '2',
    name: 'Sanctuaire Maudit',
    type: '120 mots',
    duration: '120 mots',
    participants: '3/5 prêts',
    status: 'En attente d\'escouade',
    statusColor: 'secondary',
    joinCode: 'SANCTUARY-BF',
  },
  {
    id: '3',
    name: 'Novices de Kyoto',
    type: '30 Mots',
    duration: 'Standard',
    participants: '2/4 prêts',
    status: 'Prêt à lancer',
    statusColor: 'tertiary',
    joinCode: 'KYOTO-30W',
  },
];

export default function PublicLobbies() {
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
            <span className="font-headline-sm text-headline-sm text-on-surface uppercase">Salons Publics</span>
          </div>
          <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-tertiary font-label-code text-talisman-tag uppercase">
            Ouverts
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
          <span>{activeExorcists} exorcistes en combat</span>
          <button
            onClick={refreshLobbies}
            className="hover:text-on-surface flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">sync</span>
            <span>Rafraîchir</span>
          </button>
        </div>

        <Link
          href="#"
          className="w-full py-space-sm px-space-md rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 hover:border-primary/50 text-on-surface hover:text-primary transition-all flex items-center justify-center gap-space-sm font-headline-sm text-label-code uppercase tracking-wider group shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px] text-primary group-hover:translate-x-0.5 transition-transform">
            explore
          </span>
          <span>Explorer d&apos;autres salons &amp; arènes</span>
          <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary transition-colors">
            arrow_forward
          </span>
        </Link>
      </div>
    </div>
  );
}

function LobbyCard({ lobby, onJoin }: { lobby: LobbyItem; onJoin: () => void }) {
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
          <span className="font-label-code text-talisman-tag text-outline">{lobby.type}</span>
        </div>
        <span className={`px-space-xs py-0.5 rounded font-label-code text-talisman-tag font-bold ${badgeColorMap[lobby.statusColor]}`}>
          {lobby.duration}
        </span>
      </div>

      <div className="flex items-center justify-between pt-space-xs">
        <div className="flex items-center gap-space-xs text-on-surface-variant font-label-code text-label-code">
          <span className={`material-symbols-outlined text-[16px] ${groupIconColorMap[lobby.statusColor]}`}>
            group
          </span>
          <span>{lobby.participants}</span>
          <span className="text-primary font-bold">{lobby.status}</span>
        </div>
        <button
          onClick={onJoin}
          className={`px-space-sm py-1 bg-surface-container-highest text-on-surface rounded font-headline-sm text-label-code uppercase transition-colors ${bgColorMap[lobby.statusColor]}`}
        >
          Rejoindre
        </button>
      </div>
    </div>
  );
}
