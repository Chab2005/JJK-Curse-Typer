'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Avatar from '@/components/shared/Avatar';
import BevelSelect from '@/components/shared/BevelSelect';
import IconButton from './IconButton';
import { BOT_LEVELS, type BotLevel, type LobbyRoom, type Participant, isReady, readyCount } from './lobbyRoom';

/** Nom affiché d'un participant : son pseudo, ou « Cadavre maudit 2 » pour un bot (BOT-1). */
export function useParticipantName() {
  const t = useTranslations('Lobby.participants');
  return (participant: Participant) => (participant.kind === 'human' ? participant.name : t('botName', { number: participant.number }));
}

// Participants du salon et leur état de préparation (LOB-9) ; l'hôte ajoute des bots,
// expulse et désigne un nouvel hôte (LOB-8, LOB-11).
export default function ParticipantList({
  room,
  viewerId,
  isHost,
  onAddBot,
  onKick,
  onMakeHost,
}: {
  room: LobbyRoom;
  viewerId: string;
  isHost: boolean;
  onAddBot: (level: BotLevel) => void;
  onKick: (participant: Participant) => void;
  onMakeHost: (participant: Participant) => void;
}) {
  const t = useTranslations('Lobby.participants');

  return (
    <section aria-labelledby="participants-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="participants-title" className="flex items-baseline gap-3 text-xl uppercase tracking-[0.12em]">
          {t('title')}{' '}
          <span className="font-label-code text-[15px] text-on-surface-variant">{t('count', { count: room.participants.length, capacity: room.settings.capacity })}</span>
        </h2>
        <p className="font-label-code text-[12px] uppercase tracking-[0.16em] text-tertiary">{t('ready', { count: readyCount(room) })}</p>
      </div>

      {isHost && <BotAdder full={room.participants.length >= room.settings.capacity} onAdd={onAddBot} />}

      <ul aria-labelledby="participants-title" className="grid gap-2.5 sm:grid-cols-2">
        {room.participants.map((participant) => (
          <ParticipantRow
            key={participant.id}
            participant={participant}
            room={room}
            viewerId={viewerId}
            isHost={isHost}
            onKick={() => onKick(participant)}
            onMakeHost={() => onMakeHost(participant)}
          />
        ))}
      </ul>
    </section>
  );
}

function ParticipantRow({
  participant,
  room,
  viewerId,
  isHost,
  onKick,
  onMakeHost,
}: {
  participant: Participant;
  room: LobbyRoom;
  viewerId: string;
  isHost: boolean;
  onKick: () => void;
  onMakeHost: () => void;
}) {
  const t = useTranslations('Lobby.participants');
  const tBots = useTranslations('Lobby.bots');
  const name = useParticipantName()(participant);
  const isRoomHost = participant.id === room.hostId;
  const ready = isReady(room, participant);

  return (
    <li className={`flex items-center gap-3 border-l-[3px] bg-surface-container-low py-2.5 pr-1.5 pl-3 ${ready ? 'border-tertiary' : 'border-outline-variant'}`}>
      {participant.kind === 'human' ? (
        <Avatar avatar={participant.avatar} name={participant.name} size={40} />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[50%] bg-secondary-container text-on-secondary-container">
          <span aria-hidden="true" className="material-symbols-outlined text-[22px]">smart_toy</span>
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="font-grotesk truncate text-[16px] text-on-surface">{name}</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {isRoomHost && <Tag icon="crown" className="text-gold">{t('host')}</Tag>}
          {participant.id === viewerId && <Tag className="text-primary">{t('you')}</Tag>}
          {participant.kind === 'bot' && <Tag icon="smart_toy" className="text-secondary">{t('bot', { level: tBots(`levels.${participant.level}`) })}</Tag>}
          {/* L'état est écrit en toutes lettres, pas seulement porté par la couleur (UI-8). */}
          <Tag icon={ready ? 'check_circle' : 'hourglass_empty'} className={ready ? 'text-tertiary' : 'text-outline'}>
            {ready ? t('readyState') : t('notReady')}
          </Tag>
        </p>
      </div>

      {isHost && !isRoomHost && (
        <div className="flex shrink-0">
          {participant.kind === 'human' && <IconButton icon="crown" label={t('makeHost', { name })} onClick={onMakeHost} />}
          <IconButton
            icon={participant.kind === 'bot' ? 'close' : 'person_remove'}
            label={participant.kind === 'bot' ? t('removeBot', { name }) : t('kick', { name })}
            onClick={onKick}
          />
        </div>
      )}
    </li>
  );
}

function Tag({ icon, className, children }: { icon?: string; className: string; children: React.ReactNode }) {
  return (
    <span className={`font-label-code inline-flex items-center gap-1 text-[12px] ${className}`}>
      {icon && <span aria-hidden="true" className="material-symbols-outlined text-[14px]">{icon}</span>}
      {children}
    </span>
  );
}

function BotAdder({ full, onAdd }: { full: boolean; onAdd: (level: BotLevel) => void }) {
  const t = useTranslations('Lobby.bots');
  const [level, setLevel] = useState<BotLevel>('intermediate');

  return (
    <div className="flex flex-wrap items-center gap-3 border border-dashed border-outline-variant px-4 py-3">
      <span id="bot-level" className="text-[13px] uppercase tracking-[0.14em] text-on-surface-variant">{t('level')}</span>
      <BevelSelect labelId="bot-level" options={BOT_LEVELS} value={level} onChange={setLevel} optionLabel={(option) => t(`levels.${option}`)} />
      <button
        type="button"
        disabled={full}
        onClick={() => onAdd(level)}
        className="flex min-h-11 items-center gap-2 border border-on-surface px-4 text-[13px] uppercase tracking-[0.12em] transition-colors hover:bg-on-surface hover:text-surface-container-lowest disabled:pointer-events-none disabled:border-outline-variant disabled:text-outline"
      >
        <span aria-hidden="true" className="material-symbols-outlined text-[18px]">smart_toy</span>
        {t('add')}
      </button>
      {full && <p className="text-[14px] text-outline">{t('full')}</p>}
    </div>
  );
}
