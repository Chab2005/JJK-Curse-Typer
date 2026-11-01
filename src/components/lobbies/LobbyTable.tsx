import { useTranslations } from 'next-intl';
import ChevronButton from '@/components/shared/ChevronButton';
import { Link } from '@/i18n/navigation';
import { type LobbySummary, isJoinable, lobbyHref, textCharsLabel } from './lobbySearch';

const languagesLabel = (lobby: LobbySummary) => lobby.languages.map((l) => l.toUpperCase()).join(' · ');

/** Colonnes partagées par l'en-tête et les rangées ; les colonnes secondaires apparaissent avec la largeur. */
const COLUMNS = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 sm:gap-x-3 sm:grid-cols-[minmax(0,1fr)_92px_168px] md:grid-cols-[minmax(0,1fr)_92px_100px_104px_168px] lg:grid-cols-[minmax(0,1fr)_92px_100px_104px_150px_168px]';

// Tableau des lobbies publics, en rangées pointées (canvas « Arènes · style cramoisi »).
// Sous `md`, les colonnes secondaires passent sous le nom du lobby.
export default function LobbyTable({ lobbies }: { lobbies: LobbySummary[] }) {
  const t = useTranslations('Lobbies.table');

  return (
    <table className="block w-full text-left">
      <caption className="sr-only">{t('caption')}</caption>
      <thead className="font-label-code block text-[11px] uppercase tracking-[0.16em] text-outline">
        <tr className={`${COLUMNS} pr-2 pb-2 pl-6 sm:pr-3.5 sm:pl-[59px]`}>
          <th scope="col" className="font-medium">{t('lobby')}</th>
          <th scope="col" className="hidden font-medium sm:block">{t('players')}</th>
          <th scope="col" className="hidden font-medium md:block">{t('language')}</th>
          <th scope="col" className="hidden font-medium md:block">{t('bonus')}</th>
          <th scope="col" className="hidden font-medium lg:block">{t('chars')}</th>
          <th scope="col"><span className="sr-only">{t('action')}</span></th>
        </tr>
      </thead>
      <tbody className="flex flex-col gap-2.5">
        {lobbies.map((lobby) => (
          <LobbyRow key={lobby.code} lobby={lobby} />
        ))}
      </tbody>
    </table>
  );
}

// Rangée pointée : cadre cramoisi et losange cramoisi si l'on peut rejoindre, bleu si la course est lancée, éteint si c'est complet.
// Sur téléphone, pointes plus courtes et pas de losange, pour laisser la place au nom.
function LobbyRow({ lobby }: { lobby: LobbySummary }) {
  const t = useTranslations('Lobbies.table');
  const joinable = isJoinable(lobby);
  const marker = joinable ? 'bg-primary-container' : lobby.status === 'racing' ? 'bg-secondary' : 'bg-outline-variant';

  return (
    <tr className={`hx-row ${COLUMNS} min-h-[74px] py-2.5 pr-2 pl-6 [--h:14px] sm:pr-3.5 sm:pl-[34px] sm:[--h:22px] ${joinable ? '[--row-frame:#8f1022]' : '[--row-frame:#3a2022]'}`}>
      <td className="flex min-w-0 items-center gap-4">
        <span aria-hidden="true" className={`hidden size-2 shrink-0 rotate-45 sm:block ${marker}`} />
        <span className="flex min-w-0 flex-col gap-[3px]">
          <span className="font-grotesk text-[17px] leading-6 text-on-primary-container [overflow-wrap:anywhere] sm:text-[19px]">{lobby.host}</span>
          <span className="font-label-code text-[12px] text-outline">
            {lobby.name} · {t('words', { count: lobby.words })}
          </span>
          {/* Colonnes masquées sur téléphone */}
          <span className="font-label-code text-[12px] text-on-surface-variant md:hidden">
            <span className="font-label-code sm:hidden">{t('count', { players: lobby.players, capacity: lobby.capacity })} · </span>
            {languagesLabel(lobby)} · {lobby.bonus ? t('bonusOn') : t('bonusOff')} · {textCharsLabel(lobby.chars)}
          </span>
        </span>
      </td>
      <td className="font-label-code hidden text-[15px] whitespace-nowrap sm:block">
        <span className={`font-label-code ${lobby.players >= lobby.capacity ? 'text-outline' : 'text-on-surface'}`}>
          {t('count', { players: lobby.players, capacity: lobby.capacity })}
        </span>
        {lobby.status === 'racing' && <span className="font-label-code mt-1 block text-[11px] uppercase tracking-widest text-secondary">{t('racing')}</span>}
        {lobby.status === 'waiting' && !joinable && <span className="font-label-code mt-1 block text-[11px] uppercase tracking-widest text-outline">{t('full')}</span>}
      </td>
      <td className="font-label-code hidden text-[13px] text-[#c9aeaf] md:block">{languagesLabel(lobby)}</td>
      <td className={`font-label-code hidden text-[13px] md:block ${lobby.bonus ? 'text-tertiary' : 'text-outline'}`}>{lobby.bonus ? t('bonusOn') : t('bonusOff')}</td>
      <td className="font-label-code hidden text-[13px] text-[#c9aeaf] lg:block">{textCharsLabel(lobby.chars)}</td>
      <td className="flex justify-end">
        {/* Rejoindre et Regarder ont la même largeur, pour s'aligner d'une rangée à l'autre. */}
        <ChevronButton
          as={Link}
          href={lobbyHref(lobby)}
          size="sm"
          variant={joinable ? 'primary' : 'secondary'}
          chevrons="right"
          aria-label={joinable ? t('joinLabel', { name: lobby.name }) : t('spectateLabel', { name: lobby.name })}
          frame="sm:w-[168px]"
          className="font-label-code text-[11px] uppercase tracking-[0.16em] whitespace-nowrap"
        >
          {/* L'icône Material force `display`, d'où l'enveloppe qui la masque sur téléphone. */}
          <span aria-hidden="true" className="hidden sm:inline-flex">
            <span className={`material-symbols-outlined text-[16px] ${joinable ? '' : 'text-on-surface-variant'}`}>{joinable ? 'swords' : 'visibility'}</span>
          </span>
          {joinable ? t('join') : t('spectate')}
        </ChevronButton>
      </td>
    </tr>
  );
}
