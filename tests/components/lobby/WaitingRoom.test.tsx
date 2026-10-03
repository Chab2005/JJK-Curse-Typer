import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { LobbyRoom } from '@/components/lobby/lobbyRoom';
import WaitingRoom from '@/components/lobby/WaitingRoom';
import { renderWithIntl } from '../../render';

const ROOM: LobbyRoom = {
  code: 'SHJ-60S',
  name: 'Shinjuku Showdown',
  status: 'waiting',
  hostId: 'Satoru_Infinity',
  participants: [
    { kind: 'human', id: 'Satoru_Infinity', name: 'Satoru_Infinity', avatar: 'gojo', ready: true },
    { kind: 'human', id: 'Yuji_BlackFlash', name: 'Yuji_BlackFlash', avatar: 'yuji', ready: false },
    { kind: 'bot', id: 'bot-1', level: 'expert', number: 1 },
  ],
  spectators: [{ id: 'Ijichi_Driver', name: 'Ijichi_Driver', avatar: null }],
  settings: { languages: ['fr'], content: 'sentences', words: 60, chars: ['uppercase'], practice: '', timer: 0, errorMode: 'accumulate', bonus: true, capacity: 4 },
};

const participants = () => within(screen.getByRole('list', { name: /Exorcists/ }));

describe('WaitingRoom (LOB-9)', () => {
  it('shows the lobby, its code and every participant with their ready state', () => {
    renderWithIntl(<WaitingRoom initialRoom={ROOM} viewerId="Yuji_BlackFlash" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Shinjuku Showdown' })).toBeInTheDocument();
    expect(screen.getByText('SHJ-60S', { ignore: '[aria-hidden="true"]' })).toBeInTheDocument();
    expect(participants().getAllByRole('listitem')).toHaveLength(3);
    expect(participants().getByText('Cursed corpse 1')).toBeInTheDocument();
    expect(screen.getByText('3/4')).toBeInTheDocument();
    expect(screen.getByText('2 ready')).toBeInTheDocument();
  });

  it('lets a player toggle their ready state', async () => {
    const { user } = renderWithIntl(<WaitingRoom initialRoom={ROOM} viewerId="Yuji_BlackFlash" />);

    await user.click(screen.getByRole('button', { name: "I'm ready" }));

    expect(screen.getByText('3 ready')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Not ready anymore' })).toBeInTheDocument();
  });

  it('hides the host controls from a player', () => {
    renderWithIntl(<WaitingRoom initialRoom={ROOM} viewerId="Yuji_BlackFlash" />);

    expect(screen.queryByRole('button', { name: 'Add a bot' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Kick/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start the race' })).not.toBeInTheDocument();
    expect(screen.getByText('Only the host can change these settings.')).toBeInTheDocument();
  });
});

describe('WaitingRoom host controls (LOB-8, LOB-11)', () => {
  it('adds a bot of the chosen level, up to the capacity', async () => {
    const { user } = renderWithIntl(<WaitingRoom initialRoom={ROOM} viewerId="Satoru_Infinity" />);

    await user.selectOptions(screen.getByLabelText('Bot level'), 'beginner');
    await user.click(screen.getByRole('button', { name: 'Add a bot' }));

    expect(participants().getByText('Cursed corpse 2')).toBeInTheDocument();
    expect(participants().getByText('Bot · Beginner')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Cursed corpse 2 joined the lobby.');
    expect(screen.getByRole('button', { name: 'Add a bot' })).toBeDisabled();
    expect(screen.getByText('The lobby is full.')).toBeInTheDocument();
  });

  it('kicks a player, removes a bot and kicks a spectator', async () => {
    const { user } = renderWithIntl(<WaitingRoom initialRoom={ROOM} viewerId="Satoru_Infinity" />);

    await user.click(screen.getByRole('button', { name: 'Kick Yuji_BlackFlash' }));
    expect(participants().queryByText('Yuji_BlackFlash')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Yuji_BlackFlash was kicked.');

    await user.click(screen.getByRole('button', { name: 'Remove Cursed corpse 1' }));
    expect(participants().queryByText('Cursed corpse 1')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Kick Ijichi_Driver' }));
    expect(screen.getByText('No spectators.')).toBeInTheDocument();
  });

  it('cannot kick or demote themselves', () => {
    renderWithIntl(<WaitingRoom initialRoom={ROOM} viewerId="Satoru_Infinity" />);

    expect(screen.queryByRole('button', { name: 'Kick Satoru_Infinity' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Make Satoru_Infinity the host' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Make Cursed corpse 1 the host' })).not.toBeInTheDocument();
  });

  it('hands the host role to another player and loses the controls', async () => {
    const { user } = renderWithIntl(<WaitingRoom initialRoom={ROOM} viewerId="Satoru_Infinity" />);

    await user.click(screen.getByRole('button', { name: 'Make Yuji_BlackFlash the host' }));

    expect(screen.getByRole('status')).toHaveTextContent('Yuji_BlackFlash is now the host.');
    expect(screen.queryByRole('button', { name: 'Add a bot' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: "I'm ready" })).toBeInTheDocument();
  });

  it('only starts the race once every player is ready (LOB-7)', async () => {
    const { user, rerender } = renderWithIntl(<WaitingRoom initialRoom={ROOM} viewerId="Satoru_Infinity" />);

    expect(screen.getByRole('button', { name: 'Start the race' })).toBeDisabled();
    expect(screen.getByText('Waiting for every exorcist to be ready.')).toBeInTheDocument();

    const ready = { ...ROOM, participants: ROOM.participants.map((p) => (p.kind === 'human' ? { ...p, ready: true } : p)) };
    rerender(<WaitingRoom key="ready" initialRoom={ready} viewerId="Satoru_Infinity" />);
    await user.click(screen.getByRole('button', { name: 'Start the race' }));
    expect(screen.getByRole('status')).toHaveTextContent('The race screen is coming soon.');
  });

  it('edits the race settings (LOB-5)', async () => {
    const { user } = renderWithIntl(<WaitingRoom initialRoom={ROOM} viewerId="Satoru_Infinity" />);

    await user.click(screen.getByRole('checkbox', { name: 'English' }));
    await user.click(screen.getByRole('button', { name: 'Block until fixed' }));

    expect(screen.getByRole('checkbox', { name: 'English' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Block until fixed' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('WaitingRoom spectator view', () => {
  it('shows a spectator banner and no ready button', () => {
    renderWithIntl(<WaitingRoom initialRoom={ROOM} viewerId="Ijichi_Driver" />);

    expect(screen.getByRole('heading', { name: 'Spectator mode' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: "I'm ready" })).not.toBeInTheDocument();
    expect(screen.getByText("Spectators don't take part in the race.")).toBeInTheDocument();
  });

  it('explains when a race is already running', () => {
    renderWithIntl(<WaitingRoom initialRoom={{ ...ROOM, status: 'racing' }} viewerId="Ijichi_Driver" />);

    expect(screen.getByText("A race is in progress. You're watching it as a spectator.")).toBeInTheDocument();
  });
});
