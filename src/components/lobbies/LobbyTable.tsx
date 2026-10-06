import { useTranslations } from 'next-intl';
import BevelFrame, { goldFrame } from '@/components/shared/BevelFrame';
import { Link } from '@/i18n/navigation';
import { type LobbySummary, isJoinable, lobbyHref, textCharsLabel } from './lobbySearch';

const languagesLabel = (lobby: LobbySummary) => lobby.languages.map((l) => l.toUpperCase()).join(' · ');

// Tableau des lobbies publics. Sous `md`, les colonnes secondaires passent sous le nom du lobby.
export default function LobbyTable({ lobbies }: { lobbies: LobbySummary[] }) {
  const t = useTranslations('Lobbies.table');

  return (
    <table className="w-full border-separate border-spacing-y-2.5 text-left">
      <caption className="sr-only">{t('caption')}</caption>
      <thead className="font-label-code text-[11px] uppercase tracking-[0.16em] text-outline">
        <tr>
          <th scope="col" className="px-4 pb-1 font-medium">{t('lobby')}</th>
          <th scope="col" className="hidden px-3 pb-1 font-medium sm:table-cell">{t('players')}</th>
          <th scope="col" className="hidden px-3 pb-1 font-medium md:table-cell">{t('language')}</th>
          <th scope="col" className="hidden px-3 pb-1 font-medium md:table-cell">{t('bonus')}</th>
          <th scope="col" className="hidden px-3 pb-1 font-medium lg:table-cell">{t('chars')}</th>
          <th scope="col" className="px-3 pb-1"><span className="sr-only">{t('action')}</span></th>
        </tr>
      </thead>
      <tbody>
        {lobbies.map((lobby) => (
          <LobbyRow key={lobby.code} lobby={lobby} />
        ))}
      </tbody>
    </table>
  );
}

function LobbyRow({ lobby }: { lobby: LobbySummary }) {
  const t = useTranslations('Lobbies.table');
  const joinable = isJoinable(lobby);
  const cell = 'bg-surface-container-low px-3 py-3.5 transition-colors group-hover:bg-surface-container-high';

  return (
    <tr className="group">
      <td className={`${cell} border-l-[3px] pl-3.5 sm:pl-4 ${joinable ? 'border-primary-container' : 'border-outline-variant'}`}>
        <p className="font-grotesk text-[17px] leading-6 text-on-surface [overflow-wrap:anywhere] sm:text-[19px]">{lobby.host}</p>
        <p className="font-label-code text-[12px] text-outline">
          {lobby.name} · {t('words', { count: lobby.words })}
        </p>
        {/* Colonnes masquées sur téléphone */}
        <p className="font-label-code mt-1 text-[12px] text-on-surface-variant md:hidden">
          <span className="font-label-code sm:hidden">{t('count', { players: lobby.players, capacity: lobby.capacity })} · </span>
          {languagesLabel(lobby)} · {lobby.bonus ? t('bonusOn') : t('bonusOff')} · {textCharsLabel(lobby.chars)}
        </p>
      </td>
      <td className={`${cell} font-label-code hidden text-[15px] whitespace-nowrap sm:table-cell`}>
        <span className={`font-label-code ${lobby.players >= lobby.capacity ? 'text-outline' : 'text-on-surface'}`}>
          {t('count', { players: lobby.players, capacity: lobby.capacity })}
        </span>
        {lobby.status === 'racing' && <span className="font-label-code mt-1 block text-[11px] uppercase tracking-widest text-primary">{t('racing')}</span>}
        {lobby.status === 'waiting' && !joinable && <span className="font-label-code mt-1 block text-[11px] uppercase tracking-widest text-outline">{t('full')}</span>}
      </td>
      <td className={`${cell} font-label-code hidden text-[13px] md:table-cell`}>{languagesLabel(lobby)}</td>
      <td className={`${cell} font-label-code hidden text-[13px] md:table-cell ${lobby.bonus ? 'text-tertiary' : 'text-outline'}`}>
        {lobby.bonus ? t('bonusOn') : t('bonusOff')}
      </td>
      <td className={`${cell} font-label-code hidden text-[13px] text-on-surface-variant lg:table-cell`}>{textCharsLabel(lobby.chars)}</td>
      <td className={`${cell} w-0 pr-2.5 pl-1 text-right sm:pr-4 sm:pl-3`}>
        <BevelFrame
          as={Link}
          href={lobbyHref(lobby)}
          aria-label={joinable ? t('joinLabel', { name: lobby.name }) : t('spectateLabel', { name: lobby.name })}
          frame={`group/btn inline-flex transition-transform hover:-translate-y-0.5 ${joinable ? goldFrame : 'bg-outline'}`}
          className={`flex min-h-11 items-center gap-2 px-4 text-[13px] whitespace-nowrap uppercase tracking-[0.12em] transition-colors sm:px-5 ${
            joinable
              ? 'bg-primary-container text-on-primary-container group-hover/btn:bg-inverse-primary'
              : 'bg-surface-container-lowest text-on-surface group-hover/btn:bg-surface-container-high'
          }`}
        >
          {/* L'icône Material force `display`, d'où l'enveloppe qui la masque sur téléphone. */}
          <span aria-hidden="true" className="hidden sm:inline-flex">
            <span className="material-symbols-outlined text-[18px]">{joinable ? 'swords' : 'visibility'}</span>
          </span>
          {joinable ? t('join') : t('spectate')}
        </BevelFrame>
      </td>
    </tr>
  );
}
