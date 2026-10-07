import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InviteCard from '@/components/lobby/InviteCard';
import type { LobbyVisibility } from '@/components/lobby/lobbyRoom';
import { renderWithIntl } from '../../render';

/** Vrai si le texte est affiché, et non gardé caché par <Reserve> pour réserver sa place. */
const isShown = (text: string) => screen.getByText(text).closest('[aria-hidden="true"]') === null;

describe('InviteCard (LOB-3, LOB-4)', () => {
  it('copies the lobby code', async () => {
    const { user } = renderWithIntl(<InviteCard code="SHJ-60S" visibility="public" isHost={false} />);

    await user.click(screen.getByRole('button', { name: 'Copy code' }));

    expect(await navigator.clipboard.readText()).toBe('SHJ-60S');
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });

  it.each<LobbyVisibility>(['public', 'code', 'private'])('gives no link to a player who is not the host (%s)', (visibility) => {
    renderWithIntl(<InviteCard code="SHJ-60S" visibility={visibility} isHost={false} />);

    expect(screen.getByRole('button', { name: 'Invite links' })).toBeDisabled();
    expect(isShown('Only the host can share an invite link.')).toBe(true);
  });

  it('opens the invite links window for the host', async () => {
    const { user } = renderWithIntl(<InviteCard code="SHJ-60S" visibility="code" isHost />);

    expect(isShown('Each invite link works for one person only.')).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Invite links' }));

    expect(screen.getByRole('dialog', { name: 'Invite links' })).toBeInTheDocument();
  });

  it('hides the code of a private lobby', () => {
    renderWithIntl(<InviteCard code="SHJ-60S" visibility="private" isHost />);

    expect(screen.queryByText('SHJ-60S')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy code' })).not.toBeInTheDocument();
    expect(screen.getByText('Private lobby: invite link only')).toBeInTheDocument();
  });

  // La carte garde les mêmes blocs dans tous les cas, pour ne pas changer de taille (le pixel près est vérifié par e2e/).
  it.each<[LobbyVisibility, boolean]>([
    ['public', true],
    ['code', true],
    ['private', true],
    ['public', false],
    ['private', false],
  ])('keeps the same blocks for a %s lobby (host: %s)', (visibility, isHost) => {
    renderWithIntl(<InviteCard code="SHJ-60S" visibility={visibility} isHost={isHost} />);

    expect(screen.getAllByRole('button', { name: 'Invite links' })).toHaveLength(1);
  });
});
