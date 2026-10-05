import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import JoinForm from '@/components/home/JoinForm';
import { authActionsMock, lobbyActionsMock } from '../../actions';
import { renderWithIntl } from '../../render';
import { routerMock } from '../../router';

describe('JoinForm', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('opens the lobby of the typed code (LOB-3)', async () => {
    const { user } = renderWithIntl(<JoinForm />);
    await user.type(screen.getByLabelText(/PIN/), 'abc-234');

    await user.click(screen.getByRole('button', { name: 'Expand the domain' }));

    expect(routerMock.push).toHaveBeenCalledWith('/lobby/ABC-234');
  });

  it('creates a new private lobby and opens it (LOB-4)', async () => {
    lobbyActionsMock.createLobbyAction.mockResolvedValue('NEW-234');
    const { user } = renderWithIntl(<JoinForm accountName="Megumi_Shadows" />);

    await user.click(screen.getByRole('button', { name: 'Create a new lobby' }));

    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith('/lobby/NEW-234'));
    expect(lobbyActionsMock.createLobbyAction).toHaveBeenCalledTimes(1);
  });

  it('says when the lobby could not be created', async () => {
    lobbyActionsMock.createLobbyAction.mockRejectedValue(new Error('down'));
    const { user } = renderWithIntl(<JoinForm accountName="Megumi_Shadows" />);

    await user.click(screen.getByRole('button', { name: 'Create a new lobby' }));

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't create the lobby. Try again.");
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it('falls back to the demo PIN when none is typed', async () => {
    const { user } = renderWithIntl(<JoinForm />);

    await user.click(screen.getByRole('button', { name: 'Expand the domain' }));

    expect(screen.getByRole('status')).toHaveTextContent('884-JJK');
  });

  it('caps the PIN at XXX-XXX', async () => {
    const { user } = renderWithIntl(<JoinForm />);
    const pin = screen.getByLabelText(/PIN/);

    await user.type(pin, '234-5678');

    expect(pin).toHaveValue('234-567');
  });

  it('formats the PIN while typing: upper-case, auto dash, no confusing characters', async () => {
    const { user } = renderWithIntl(<JoinForm />);
    const pin = screen.getByLabelText(/PIN/);

    await user.type(pin, 'a0b1cOdIeLf');

    expect(pin).toHaveValue('ABC-DEF');
  });

  it('blocks submit while the PIN is incomplete', async () => {
    const { user } = renderWithIntl(<JoinForm />);
    const pin = screen.getByLabelText(/PIN/);
    const submit = screen.getByRole('button', { name: 'Expand the domain' });

    await user.type(pin, 'abc-d');
    expect(submit).toBeDisabled();

    await user.type(pin, 'ef');
    expect(submit).toBeEnabled();
  });

  it('draws another exorcist name with the random button', async () => {
    const { user } = renderWithIntl(<JoinForm />);
    const name = screen.getByLabelText('Exorcist name');
    expect(name).toHaveValue('Megumi_Shadows');

    await user.click(screen.getByRole('button', { name: 'Random' }));

    expect(name).not.toHaveValue('Megumi_Shadows');
    expect((name as HTMLInputElement).value).not.toBe('');
  });

  it('sends a guest to the login page instead of creating a lobby: guests cannot host', async () => {
    const { user } = renderWithIntl(<JoinForm />);

    await user.click(screen.getByRole('button', { name: 'Log in to create a lobby' }));

    expect(lobbyActionsMock.createLobbyAction).not.toHaveBeenCalled();
    expect(routerMock.push).toHaveBeenCalledWith('/login');
  });

  it('saves the guest name (3 to 20 characters) before joining a lobby', async () => {
    const { user } = renderWithIntl(<JoinForm />);
    await user.type(screen.getByLabelText(/PIN/), 'abc-234');

    await user.click(screen.getByRole('button', { name: 'Expand the domain' }));

    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith('/lobby/ABC-234'));
    expect(authActionsMock.setGuestNameAction).toHaveBeenCalledWith('Megumi_Shadows');
  });

  it('refuses a guest name that is too short and does not join', async () => {
    const { user } = renderWithIntl(<JoinForm />);
    await user.type(screen.getByLabelText(/PIN/), 'abc-234');
    const name = screen.getByLabelText('Exorcist name');
    await user.clear(name);
    await user.type(name, 'ab');

    await user.click(screen.getByRole('button', { name: 'Expand the domain' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('3 to 20');
    expect(authActionsMock.setGuestNameAction).not.toHaveBeenCalled();
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it('uses the account name as is for a signed-in user, with no guest step', async () => {
    const { user } = renderWithIntl(<JoinForm accountName="Yuji" />);
    await user.type(screen.getByLabelText(/PIN/), 'abc-234');

    expect(screen.getByLabelText('Exorcist name')).toHaveValue('Yuji');
    expect(screen.getByLabelText('Exorcist name')).toHaveAttribute('readonly');
    expect(screen.queryByRole('button', { name: 'Random' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand the domain' }));

    expect(routerMock.push).toHaveBeenCalledWith('/lobby/ABC-234');
    expect(authActionsMock.setGuestNameAction).not.toHaveBeenCalled();
  });
});
