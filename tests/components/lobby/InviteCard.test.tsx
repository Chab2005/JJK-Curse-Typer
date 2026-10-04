import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InviteCard from '@/components/lobby/InviteCard';
import type { LobbyVisibility } from '@/components/lobby/lobbyRoom';
import { lobbyActionsMock } from '../../actions';
import { renderWithIntl } from '../../render';

const TOKEN = 'abcdefghijklmnopqrstu_';

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

    expect(screen.getByRole('button', { name: /invite link/ })).toBeDisabled();
    expect(screen.getByLabelText('Invite link')).toHaveValue('');
    expect(isShown('Only the host can share an invite link.')).toBe(true);
  });

  it('shows and copies the public link without the query string', async () => {
    window.history.replaceState(null, '', '/fr/lobby/SHJ-60S?spectate=1');
    const { user } = renderWithIntl(<InviteCard code="SHJ-60S" visibility="public" isHost />);
    const link = `${window.location.origin}/fr/lobby/SHJ-60S`;

    expect(screen.getByLabelText('Invite link')).toHaveValue(link);
    await user.click(screen.getByRole('button', { name: 'Copy invite link' }));

    expect(await navigator.clipboard.readText()).toBe(link);
    expect(screen.queryByRole('button', { name: 'New invite link' })).not.toBeInTheDocument();
  });

  it('gives the host a new one-time link for a code lobby', async () => {
    window.history.replaceState(null, '', '/fr/lobby/SHJ-60S');
    lobbyActionsMock.createInviteAction.mockResolvedValue(TOKEN);
    const { user } = renderWithIntl(<InviteCard code="SHJ-60S" visibility="code" isHost />);

    expect(screen.getByText('SHJ-60S')).toBeInTheDocument();
    expect(screen.getByLabelText('Invite link')).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'New invite link' }));

    const link = `${window.location.origin}/fr/lobby/SHJ-60S?invite=${TOKEN}`;
    expect(lobbyActionsMock.createInviteAction).toHaveBeenCalledWith('SHJ-60S');
    expect(await navigator.clipboard.readText()).toBe(link);
    expect(screen.getByLabelText('Invite link')).toHaveValue(link);
    expect(isShown('Each invite link works for one person only.')).toBe(true);
  });

  it('says so when the server refuses to create a link', async () => {
    lobbyActionsMock.createInviteAction.mockResolvedValue(null);
    const { user } = renderWithIntl(<InviteCard code="SHJ-60S" visibility="private" isHost />);

    await user.click(screen.getByRole('button', { name: 'New invite link' }));

    expect(screen.getByRole('button', { name: 'Copy failed' })).toBeInTheDocument();
    expect(screen.getByLabelText('Invite link')).toHaveValue('');
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

    expect(screen.getByLabelText('Invite link')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /invite link/ })).toHaveLength(1);
  });
});
