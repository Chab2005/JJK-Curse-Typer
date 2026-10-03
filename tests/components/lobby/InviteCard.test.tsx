import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import InviteCard from '@/components/lobby/InviteCard';
import { lobbyActionsMock } from '../../actions';
import { renderWithIntl } from '../../render';

const TOKEN = 'abcdefghijklmnopqrstu_';

describe('InviteCard (LOB-3, LOB-4)', () => {
  it('copies the lobby code', async () => {
    const { user } = renderWithIntl(<InviteCard code="SHJ-60S" visibility="public" isHost={false} />);

    await user.click(screen.getByRole('button', { name: 'Copy code' }));

    expect(await navigator.clipboard.readText()).toBe('SHJ-60S');
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
  });

  it('copies the public link without the query string', async () => {
    window.history.replaceState(null, '', '/fr/lobby/SHJ-60S?spectate=1');
    const { user } = renderWithIntl(<InviteCard code="SHJ-60S" visibility="public" isHost />);

    await user.click(screen.getByRole('button', { name: 'Copy invite link' }));

    expect(await navigator.clipboard.readText()).toBe(`${window.location.origin}/fr/lobby/SHJ-60S`);
    expect(screen.queryByRole('button', { name: 'New invite link' })).not.toBeInTheDocument();
  });

  it('gives the host a new one-time link for a code lobby', async () => {
    window.history.replaceState(null, '', '/fr/lobby/SHJ-60S');
    lobbyActionsMock.createInviteAction.mockResolvedValue(TOKEN);
    const { user } = renderWithIntl(<InviteCard code="SHJ-60S" visibility="code" isHost />);

    expect(screen.getByText('SHJ-60S')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'New invite link' }));

    const link = `${window.location.origin}/fr/lobby/SHJ-60S?invite=${TOKEN}`;
    expect(lobbyActionsMock.createInviteAction).toHaveBeenCalledWith('SHJ-60S');
    expect(await navigator.clipboard.readText()).toBe(link);
    expect(screen.getByLabelText('Last invite link')).toHaveValue(link);
    expect(screen.getByText('Each invite link works for one person only.')).toBeInTheDocument();
  });

  it('says so when the server refuses to create a link', async () => {
    lobbyActionsMock.createInviteAction.mockResolvedValue(null);
    const { user } = renderWithIntl(<InviteCard code="SHJ-60S" visibility="private" isHost />);

    await user.click(screen.getByRole('button', { name: 'New invite link' }));

    expect(screen.getByRole('button', { name: 'Copy failed' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Last invite link')).not.toBeInTheDocument();
  });

  it('hides the code of a private lobby', () => {
    renderWithIntl(<InviteCard code="SHJ-60S" visibility="private" isHost />);

    expect(screen.queryByText('SHJ-60S')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy code' })).not.toBeInTheDocument();
  });

  it('tells players that only the host invites to a private lobby', () => {
    renderWithIntl(<InviteCard code="SHJ-60S" visibility="private" isHost={false} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Only the host can invite players to a private lobby.')).toBeInTheDocument();
  });
});
