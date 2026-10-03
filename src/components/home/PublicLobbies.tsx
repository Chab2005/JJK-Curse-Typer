import { useTranslations } from 'next-intl';
import type { LobbySummary } from '@/components/lobbies/lobbySearch';
import { Link } from '@/i18n/navigation';

// Lobbies publics créés par les joueurs, puis données de démonstration en attendant la room d'index (LOB-2).
type LobbyMode = { kind: 'sprint'; seconds: number } | { kind: 'words'; count: number };
type LobbyParticipants = { kind: 'exorcists' | 'ready'; current: number; max: number };
type LobbyStatus = { kind: 'startsIn'; seconds: number } | { kind: 'waitingSquad' } | { kind: 'readyToLaunch' };

interface LobbyItem {
  name: string;
  mode: LobbyMode;
  participants: LobbyParticipants;
  status: LobbyStatus;
  accent: string;
  joinCode: string;
}

const LOBBIES: LobbyItem[] = [
  {
    name: 'Shinjuku Showdown',
    mode: { kind: 'sprint', seconds: 60 },
    participants: { kind: 'exorcists', current: 7, max: 8 },
    status: { kind: 'startsIn', seconds: 12 },
    accent: 'border-primary-container',
    joinCode: 'SHJ-60S',
  },
  {
    name: 'Sanctuaire Maudit',
    mode: { kind: 'words', count: 120 },
    participants: { kind: 'ready', current: 3, max: 5 },
    status: { kind: 'waitingSquad' },
    accent: 'border-secondary',
    joinCode: 'SNC-120',
  },
  {
    name: 'Novices de Kyoto',
    mode: { kind: 'words', count: 30 },
    participants: { kind: 'ready', current: 2, max: 4 },
    status: { kind: 'readyToLaunch' },
    accent: 'border-tertiary',
    joinCode: 'KYT-30W',
  },
];

const ACCENTS = ['border-primary-container', 'border-secondary', 'border-tertiary'];
/** Lobbies affichés sur l'accueil ; la liste complète est sur /lobbies. */
const SHOWN = 3;

const toItem = (lobby: LobbySummary, index: number): LobbyItem => ({
  name: lobby.name,
  mode: { kind: 'words', count: lobby.words },
  participants: { kind: 'exorcists', current: lobby.players, max: lobby.capacity },
  status: { kind: 'waitingSquad' },
  accent: ACCENTS[index % ACCENTS.length],
  joinCode: lobby.code,
});

export default function PublicLobbies({ created = [] }: { created?: LobbySummary[] }) {
  const t = useTranslations('PublicLobbies');
  const lobbies = [...created.map(toItem), ...LOBBIES];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2 border-b border-surface-container-highest pb-2.5">
        <h3 className="text-[22px] uppercase tracking-[0.12em]">{t('title')}</h3>
        <p className="font-label-code text-[11px] uppercase tracking-[0.12em] text-tertiary">{t('openCount', { count: lobbies.length })}</p>
      </div>

      <ul className="flex flex-col gap-3">
        {lobbies.slice(0, SHOWN).map((lobby) => (
          <li key={lobby.joinCode} className={`flex items-stretch border-l-[3px] bg-surface-container-low transition-colors hover:bg-surface-container-high ${lobby.accent}`}>
            <div className="flex min-w-0 flex-grow flex-col gap-1.5 px-4 py-3.5">
              <div className="flex flex-wrap items-baseline gap-2.5">
                <p className="font-grotesk text-[19px]">{lobby.name}</p>
                <p className="font-label-code text-[11px] text-outline">{t(`mode.${lobby.mode.kind}`, lobby.mode)}</p>
              </div>
              <p className="flex items-center gap-1.5 text-sm text-on-surface-variant">
                <span aria-hidden="true" className="material-symbols-outlined text-base text-tertiary">group</span>
                {t(`participants.${lobby.participants.kind}`, lobby.participants)} ·{' '}
                <span className="text-primary">{t(`status.${lobby.status.kind}`, lobby.status)}</span>
              </p>
            </div>
            <Link
              href={`/lobby/${lobby.joinCode}`}
              aria-label={t('joinLabel', { name: lobby.name })}
              className="flex items-center bg-surface-container-high px-5 text-[13px] uppercase tracking-widest text-on-surface transition-colors hover:bg-primary-container hover:text-on-primary-container"
            >
              {t('join')}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/lobbies"
        className="mt-1.5 flex min-h-13 items-center justify-center gap-2.5 border border-on-surface text-[15px] uppercase tracking-[0.16em] text-on-surface transition-colors hover:bg-on-surface hover:text-surface-container-lowest"
      >
        {t('all')}
        <span aria-hidden="true" className="material-symbols-outlined text-lg">arrow_forward</span>
      </Link>
    </div>
  );
}
