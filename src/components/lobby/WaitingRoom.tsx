'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import PageIntro from '@/components/shared/PageIntro';
import { useRouter } from '@/i18n/navigation';
import InviteCard from './InviteCard';
import LobbySettingsPanel from './LobbySettingsPanel';
import ParticipantList, { useParticipantName } from './ParticipantList';
import ReadyPanel from './ReadyPanel';
import SpectatorList from './SpectatorList';
import { type LobbyAction, type LobbyRoom, type Participant, lobbyReducer, startBlocker, viewerRole } from './lobbyRoom';

// Salon d'attente d'un lobby (LOB-5 à LOB-9, LOB-11). En attendant la room temps réel,
// les actions passent par le réducteur pur et ne vivent que dans cette page.
export default function WaitingRoom({ initialRoom, viewerId }: { initialRoom: LobbyRoom; viewerId: string }) {
  const t = useTranslations('Lobby');
  const participantName = useParticipantName();
  const router = useRouter();
  const [room, setRoom] = useState(initialRoom);
  const [announcement, setAnnouncement] = useState('');

  const role = viewerRole(room, viewerId);
  const isHost = role === 'host';
  const me = room.participants.find((p) => p.id === viewerId);
  const host = room.participants.find((p) => p.id === room.hostId);

  const apply = (action: LobbyAction) => {
    const next = lobbyReducer(room, action);
    setRoom(next);
    return next;
  };

  const kick = (target: Participant | { id: string; name: string }) => {
    apply({ type: 'kick', by: viewerId, id: target.id });
    const isBot = 'kind' in target && target.kind === 'bot';
    const name = 'kind' in target ? participantName(target) : target.name;
    setAnnouncement(t(isBot ? 'announce.botRemoved' : 'announce.kicked', { name }));
  };

  return (
    <div className="relative mx-auto flex max-w-[1152px] flex-col gap-10 px-6 pt-14 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div className="min-w-0 flex-1 basis-[420px]">
          <PageIntro
            id="lobby-title"
            eyebrow={t('eyebrow')}
            title={room.name}
            watermark={room.code}
            intro={
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {host && t('hostedBy', { host: participantName(host) })}
                <span className={`font-label-code inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.14em] ${room.status === 'racing' ? 'text-primary' : 'text-tertiary'}`}>
                  <span aria-hidden="true" className={`size-[7px] rounded-full ${room.status === 'racing' ? 'bg-primary' : 'bg-tertiary'}`} />
                  {t(`status.${room.status}`)}
                </span>
              </span>
            }
          />
        </div>
        <div className="w-full sm:w-auto">
          <InviteCard code={room.code} />
        </div>
      </div>

      {role === 'spectator' && (
        <section aria-labelledby="spectating-title" className="flex items-start gap-4 border-l-[3px] border-secondary bg-secondary-container/20 px-5 py-4">
          <span aria-hidden="true" className="material-symbols-outlined text-[26px] text-secondary">visibility</span>
          <div className="flex flex-col gap-1">
            <h2 id="spectating-title" className="text-[15px] uppercase tracking-[0.14em] text-on-surface">{t('spectating.title')}</h2>
            <p className="text-on-surface-variant">{t(room.status === 'racing' ? 'spectating.racing' : 'spectating.waiting')}</p>
          </div>
        </section>
      )}

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-10">
          <ParticipantList
            room={room}
            viewerId={viewerId}
            isHost={isHost}
            onAddBot={(level) => {
              const bot = apply({ type: 'addBot', by: viewerId, level }).participants.at(-1);
              if (bot) setAnnouncement(t('announce.botAdded', { name: participantName(bot) }));
            }}
            onKick={kick}
            onMakeHost={(participant) => {
              apply({ type: 'transferHost', by: viewerId, id: participant.id });
              setAnnouncement(t('announce.newHost', { name: participantName(participant) }));
            }}
          />
          <SpectatorList spectators={room.spectators} viewerId={viewerId} isHost={isHost} onKick={kick} />
        </div>

        <aside className="flex flex-col gap-6">
          <ReadyPanel
            role={role}
            ready={me?.kind === 'human' && me.ready}
            blocker={startBlocker(room)}
            onToggleReady={() => me?.kind === 'human' && apply({ type: 'setReady', id: viewerId, ready: !me.ready })}
            onStart={() => router.push(`/lobby/${room.code}/race`)}
          />
          <p role="status" className="font-label-code text-[13px] text-tertiary empty:hidden">{announcement}</p>
          <LobbySettingsPanel
            settings={room.settings}
            participantCount={room.participants.length}
            editable={isHost}
            onChange={(patch) => apply({ type: 'updateSettings', by: viewerId, patch })}
          />
        </aside>
      </div>
    </div>
  );
}
