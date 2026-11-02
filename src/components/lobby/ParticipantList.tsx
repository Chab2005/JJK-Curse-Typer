'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Avatar from '@/components/shared/Avatar';
import BevelSelect from '@/components/shared/BevelSelect';
import ChevronButton from '@/components/shared/ChevronButton';
import Pointer from '@/components/shared/Pointer';
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
        <h2 id="participants-title" className="flex items-baseline gap-3.5 text-2xl uppercase tracking-[0.1em]">
          {t('title')}{' '}
          <span className="font-label-code text-[15px] tracking-[0.06em] text-outline">{t('count', { count: room.participants.length, capacity: room.settings.capacity })}</span>
        </h2>
        <p className="font-label-code flex items-center gap-2.5 text-[12px] uppercase tracking-[0.16em] text-tertiary">
          <Pointer />
          {t('ready', { count: readyCount(room) })}
        </p>
      </div>

      {isHost && <BotAdder full={room.participants.length >= room.settings.capacity} onAdd={onAddBot} />}

      <ul aria-labelledby="participants-title" className="grid gap-x-2.5 gap-y-2 sm:grid-cols-2">
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

  const isMe = participant.id === viewerId;
  // Cadre de la rangée : cramoisi vif pour soi, rouge pour un joueur prêt (ou un bot), sombre sinon.
  const frame = isMe ? '#e11d48' : ready ? '#8f1022' : '#3a2022';
  const ring = isRoomHost ? 'var(--color-gold)' : participant.kind === 'bot' ? '#5a5ad8' : frame;

  return (
    <li className="hx-row flex min-h-16 items-center gap-3.5 py-2 pr-5 pl-7 [--h:16px]" style={{ '--row-frame': frame } as React.CSSProperties}>
      <span className="bevel inline-flex shrink-0 p-px" style={{ background: ring }}>
        <span className="bevel inline-flex bg-surface-container-lowest p-0.5">
          {participant.kind === 'human' ? (
            <Avatar avatar={participant.avatar} name={participant.name} src={participant.photo} size={34} shape="bevel" />
          ) : (
            <span className="bevel flex size-[34px] items-center justify-center bg-[#2a2a6a] text-secondary">
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">smart_toy</span>
            </span>
          )}
        </span>
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className={`font-grotesk truncate text-[16px] ${isMe ? 'text-primary' : 'text-on-primary-container'}`}>{name}</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {isRoomHost && <Tag icon="crown" className="text-gold">{t('host')}</Tag>}
          {isMe && <Tag className="text-primary">{t('you')}</Tag>}
          {participant.kind === 'bot' && <Tag icon="smart_toy" className="text-secondary">{t('bot', { level: tBots(`levels.${participant.level}`) })}</Tag>}
          {/* L'état est écrit en toutes lettres, pas seulement porté par la couleur (UI-8). Les bots, toujours prêts, n'en ont pas. */}
          {participant.kind === 'human' && (
            <Tag icon={ready ? 'check_circle' : 'hourglass_empty'} className={ready ? 'text-tertiary' : 'text-outline'}>
              {ready ? t('readyState') : t('notReady')}
            </Tag>
          )}
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
  const [level, setLevel] = useState<BotLevel>('grade_2');

  return (
    <div className="flex flex-wrap items-center gap-3 border-y border-[#4a1218] py-3">
      <span id="bot-level" className="font-label-code text-[11px] font-bold uppercase tracking-[0.2em] text-primary-container">{t('level')}</span>
      <BevelSelect labelId="bot-level" options={BOT_LEVELS} value={level} onChange={setLevel} optionLabel={(option) => t(`levels.${option}`)} />
      <ChevronButton type="button" size="sm" chevrons={false} frame="disabled:opacity-40" disabled={full} onClick={() => onAdd(level)} className="font-label-code text-[11px] uppercase tracking-[0.16em]">
        <span aria-hidden="true" className="material-symbols-outlined text-[16px] text-primary">smart_toy</span>
        {t('add')}
      </ChevronButton>
      {full && <p className="text-[14px] text-outline">{t('full')}</p>}
    </div>
  );
}
