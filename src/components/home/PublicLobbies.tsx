import { useTranslations } from 'next-intl';
import type { LobbySummary } from '@/components/lobbies/lobbySearch';
import ChevronButton from '@/components/shared/ChevronButton';
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
    accent: 'bg-primary-container',
    joinCode: 'SHJ-60S',
  },
  {
    name: 'Sanctuaire Maudit',
    mode: { kind: 'words', count: 120 },
    participants: { kind: 'ready', current: 3, max: 5 },
    status: { kind: 'waitingSquad' },
    accent: 'bg-secondary',
    joinCode: 'SNC-120',
  },
  {
    name: 'Novices de Kyoto',
    mode: { kind: 'words', count: 30 },
    participants: { kind: 'ready', current: 2, max: 4 },
    status: { kind: 'readyToLaunch' },
    accent: 'bg-tertiary',
    joinCode: 'KYT-30W',
  },
];

const ACCENTS = ['bg-primary-container', 'bg-secondary', 'bg-tertiary'];
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

export default function PublicLobbies({ created = [], showSamples = true }: { created?: LobbySummary[]; showSamples?: boolean }) {
  const t = useTranslations('PublicLobbies');
  const lobbies = [...created.map(toItem), ...(showSamples ? LOBBIES : [])];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2 border-b border-surface-container-highest pb-2.5">
        <h3 className="text-[22px] uppercase tracking-[0.12em]">{t('title')}</h3>
        <p className="font-label-code text-[11px] uppercase tracking-[0.12em] text-tertiary">{t('openCount', { count: lobbies.length })}</p>
      </div>

      {lobbies.length === 0 && <p className="border border-dashed border-outline-variant px-6 py-10 text-center text-on-surface-variant">{t('noLobbies')}</p>}

      <ul className="flex flex-col gap-2.5">
        {lobbies.slice(0, SHOWN).map((lobby) => (
          // Rangée à bouts pointus (canvas « Accueil · style flèches ») : losange de couleur, infos, puis « Rejoindre » à chevrons à droite.
          <li key={lobby.joinCode} className="flex bg-[#4a1218] p-px transition-[filter] duration-300 [clip-path:polygon(22px_0,calc(100%_-_22px)_0,100%_50%,calc(100%_-_22px)_100%,22px_100%,0_50%)] hover:brightness-135">
            <div className="flex min-h-[70px] flex-1 items-center gap-4 bg-linear-to-r from-[#1a0709] to-[#110506] py-2 pr-3.5 pl-[34px] [clip-path:polygon(21.5px_0,calc(100%_-_21.5px)_0,100%_50%,calc(100%_-_21.5px)_100%,21.5px_100%,0_50%)]">
              <span aria-hidden="true" className={`size-2 shrink-0 rotate-45 ${lobby.accent}`} />
              <div className="flex min-w-0 flex-grow flex-col gap-1">
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
              <ChevronButton
                as={Link}
                href={`/lobby/${lobby.joinCode}`}
                aria-label={t('joinLabel', { name: lobby.name })}
                size="sm"
                variant="primary"
                chevrons="right"
                frame="shrink-0"
                className="font-label-code text-[11px] uppercase tracking-[0.16em]"
              >
                {t('join')}
              </ChevronButton>
            </div>
          </li>
        ))}
      </ul>

      <ChevronButton as={Link} href="/lobbies" chevrons={false} frame="mt-1.5 w-full" className="text-[15px] uppercase tracking-[0.16em]">
        {t('all')}
      </ChevronButton>
    </div>
  );
}
