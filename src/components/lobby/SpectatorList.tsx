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
      <h2 id="spectators-title" className="flex items-center gap-2 text-[15px] uppercase tracking-[0.14em] text-on-surface-variant">
        <span aria-hidden="true" className="material-symbols-outlined text-[18px]">visibility</span>
        {t('title')}{' '}
        <span className="font-label-code text-[13px]">({spectators.length})</span>
      </h2>
      {spectators.length === 0 ? (
        <p className="text-[14px] text-outline">{t('empty')}</p>
      ) : (
        <ul aria-labelledby="spectators-title" className="flex flex-wrap gap-2">
          {spectators.map((spectator) => (
            <li key={spectator.id} className="flex min-h-11 items-center gap-2 bg-surface-container-low py-1 pr-1 pl-1.5">
              <Avatar avatar={spectator.avatar} name={spectator.name} size={28} />
              <span className="font-grotesk text-[14px] text-on-surface">{spectator.name}</span>
              {spectator.id === viewerId && <span className="font-label-code pr-2 text-[12px] text-primary">{tParticipants('you')}</span>}
              {isHost && spectator.id !== viewerId && <IconButton icon="person_remove" label={t('kick', { name: spectator.name })} onClick={() => onKick(spectator)} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
