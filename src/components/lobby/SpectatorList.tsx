import { useTranslations } from 'next-intl';
import Avatar from '@/components/shared/Avatar';
import IconButton from './IconButton';
import type { Spectator } from './lobbyRoom';

// Spectateurs du lobby ; l'hôte peut aussi les expulser.
export default function SpectatorList({ spectators, viewerId, isHost, onKick }: { spectators: Spectator[]; viewerId: string; isHost: boolean; onKick: (spectator: Spectator) => void }) {
  const t = useTranslations('Lobby.spectators');
  const tParticipants = useTranslations('Lobby.participants');

  return (
    <section aria-labelledby="spectators-title" className="flex flex-col gap-3">
      <h2 id="spectators-title" className="font-label-code flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">
        <span aria-hidden="true" className="material-symbols-outlined text-[16px]">visibility</span>
        {t('title')}{' '}
        <span className="font-label-code text-[13px]">({spectators.length})</span>
      </h2>
      {spectators.length === 0 ? (
        <p className="text-[14px] text-outline">{t('empty')}</p>
      ) : (
        <ul aria-labelledby="spectators-title" className="flex flex-wrap gap-2">
          {spectators.map((spectator) => (
            <li key={spectator.id} className="hx-cut flex bg-[#3a2a4a] p-px [--h:12px]">
              <span className="hx-cut flex min-h-11 items-center gap-2 bg-linear-to-b from-[#1a1222] to-[#0e0a12] py-1 pr-4 pl-5 [--h:11.5px]">
                <Avatar avatar={spectator.avatar} name={spectator.name} src={spectator.photo} size={28} shape="bevel" />
                <span className="font-grotesk text-[14px] text-secondary-fixed">{spectator.name}</span>
                {spectator.id === viewerId && <span className="font-label-code text-[12px] text-primary">{tParticipants('you')}</span>}
                {isHost && spectator.id !== viewerId && <IconButton icon="person_remove" label={t('kick', { name: spectator.name })} onClick={() => onKick(spectator)} />}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
