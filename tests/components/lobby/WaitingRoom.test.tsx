import { act, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LobbyRoom } from '@/components/lobby/lobbyRoom';
import WaitingRoom from '@/components/lobby/WaitingRoom';
import { lobbyActionsMock } from '../../actions';
import { renderWithIntl } from '../../render';
import { routerMock } from '../../router';

const ROOM: LobbyRoom = {
  code: 'SHJ-60S',
  name: 'Shinjuku Showdown',
  status: 'waiting',
  hostId: 'Satoru_Infinity',
  participants: [
    { kind: 'human', id: 'Satoru_Infinity', name: 'Satoru_Infinity', avatar: 'gojo', ready: true },
    { kind: 'human', id: 'Yuji_BlackFlash', name: 'Yuji_BlackFlash', avatar: 'yuji', ready: false },
    { kind: 'bot', id: 'bot-1', level: 'grade_1', number: 1 },
  ],
  spectators: [{ id: 'Ijichi_Driver', name: 'Ijichi_Driver', avatar: null }],
  settings: { languages: ['fr'], content: 'sentences', words: 60, chars: ['uppercase'], practice: '', timer: 0, errorMode: 'accumulate', bonus: true, capacity: 4, visibility: 'public' },
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

    await user.click(screen.getByRole('combobox', { name: 'Bot level' }));
    await user.click(screen.getByRole('option', { name: 'Grade 4' }));
    await user.click(screen.getByRole('button', { name: 'Add a bot' }));

    expect(participants().getByText('Cursed corpse 2')).toBeInTheDocument();
    expect(participants().getByText('Bot · Grade 4')).toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: 'Start the race' })).toHaveAccessibleDescription('Waiting for every exorcist to be ready.');

    const ready = { ...ROOM, participants: ROOM.participants.map((p) => (p.kind === 'human' ? { ...p, ready: true } : p)) };
    rerender(<WaitingRoom key="ready" initialRoom={ready} viewerId="Satoru_Infinity" />);
    await user.click(screen.getByRole('button', { name: 'Start the race' }));
    expect(routerMock.push).toHaveBeenCalledWith('/lobby/SHJ-60S/race');
  });

  it('sends each action to the server, which replays it on created lobbies', async () => {
    const { user } = renderWithIntl(<WaitingRoom initialRoom={ROOM} viewerId="Satoru_Infinity" />);

    await user.click(screen.getByRole('button', { name: 'Add a bot' }));
    expect(lobbyActionsMock.updateLobbyAction).toHaveBeenCalledWith('SHJ-60S', { type: 'addBot', by: 'Satoru_Infinity', level: 'grade_2' });
  });

  it('edits the race settings (LOB-5)', async () => {
    const { user } = renderWithIntl(<WaitingRoom initialRoom={ROOM} viewerId="Satoru_Infinity" />);

    await user.click(screen.getByRole('button', { name: 'Edit settings' }));
    await user.click(screen.getByRole('checkbox', { name: 'English' }));
    await user.click(screen.getByRole('button', { name: 'Block until fixed' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    const summary = screen.getAllByRole('definition').map((value) => value.textContent);
    expect(summary).toEqual(expect.arrayContaining(['French · English', 'Block until fixed']));
    expect(lobbyActionsMock.updateLobbyAction).toHaveBeenCalledWith('SHJ-60S', {
      type: 'updateSettings',
      by: 'Satoru_Infinity',
      patch: { languages: ['fr', 'en'], errorMode: 'block' },
    });
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

describe('WaitingRoom spectator switch', () => {
  it('lets a player watch as a spectator, then come back', async () => {
    const { user } = renderWithIntl(<WaitingRoom initialRoom={ROOM} viewerId="Yuji_BlackFlash" />);

    await user.click(screen.getByRole('button', { name: 'Watch as a spectator' }));
    expect(participants().queryByText('Yuji_BlackFlash')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Spectator mode' })).toBeInTheDocument();
    expect(lobbyActionsMock.updateLobbyAction).toHaveBeenCalledWith('SHJ-60S', { type: 'setSpectating', id: 'Yuji_BlackFlash', spectating: true });

    await user.click(screen.getByRole('button', { name: 'Join the race' }));
    expect(participants().getByText('Yuji_BlackFlash')).toBeInTheDocument();
  });

  it('lets the host watch while keeping the host controls', async () => {
    const { user } = renderWithIntl(<WaitingRoom initialRoom={ROOM} viewerId="Satoru_Infinity" />);

    await user.click(screen.getByRole('button', { name: 'Watch as a spectator' }));

    expect(participants().queryByText('Satoru_Infinity')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start the race' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add a bot' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Kick Satoru_Infinity' })).not.toBeInTheDocument();
  });

  it('does not let a spectator into a full lobby', () => {
    const full = { ...ROOM, settings: { ...ROOM.settings, capacity: 3 } };
    renderWithIntl(<WaitingRoom initialRoom={full} viewerId="Ijichi_Driver" />);

    expect(screen.getByRole('button', { name: 'Join the race' })).toBeDisabled();
  });
});

// Fake EventSource: the test plays the lobby event stream.
class FakeEventSource {
  static CLOSED = 2;
  static instances: FakeEventSource[] = [];
  readyState = 1;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  listeners = new Map<string, () => void>();
  constructor(public url: string) {
    FakeEventSource.instances.push(this);
  }
  addEventListener(type: string, listener: () => void) {
    this.listeners.set(type, listener);
  }
  close() {
    this.readyState = FakeEventSource.CLOSED;
  }
}

describe('WaitingRoom of a created lobby (realtime)', () => {
  const LIVE: LobbyRoom = { ...ROOM, code: 'ABC-DEF', settings: { ...ROOM.settings, visibility: 'private' } };
  const joined = { ...LIVE, participants: [...LIVE.participants, { kind: 'human' as const, id: 'Nobara', name: 'Nobara', avatar: null, ready: false }] };

  beforeEach(() => {
    FakeEventSource.instances = [];
    vi.stubGlobal('EventSource', FakeEventSource);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('joins the lobby with the invite link, then follows the stream', async () => {
    lobbyActionsMock.joinLobbyAction.mockResolvedValue(joined);
    renderWithIntl(<WaitingRoom initialRoom={joined} viewerId="Nobara" live invite={'a'.repeat(22)} />);

    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1));
    expect(lobbyActionsMock.joinLobbyAction).toHaveBeenCalledWith('ABC-DEF', { spectate: false, invite: 'a'.repeat(22) });
    expect(FakeEventSource.instances[0].url).toBe('/api/lobbies/ABC-DEF/events');

    // The host adds a bot and changes a setting: everyone sees it.
    const update = { ...joined, participants: [...joined.participants, { kind: 'bot' as const, id: 'bot-2', level: 'grade_4' as const, number: 2 }], settings: { ...joined.settings, bonus: false } };
    act(() => FakeEventSource.instances[0].onmessage!({ data: JSON.stringify(update) }));
    expect(participants().getByText('Cursed corpse 2')).toBeInTheDocument();
  });

  it('goes to the race when the host starts it', async () => {
    lobbyActionsMock.joinLobbyAction.mockResolvedValue(joined);
    renderWithIntl(<WaitingRoom initialRoom={joined} viewerId="Nobara" live />);
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1));

    act(() => FakeEventSource.instances[0].onmessage!({ data: JSON.stringify({ ...joined, status: 'racing' }) }));
    expect(routerMock.push).toHaveBeenCalledWith('/lobby/ABC-DEF/race');
  });

  it('leaves the page when kicked', async () => {
    lobbyActionsMock.joinLobbyAction.mockResolvedValue(joined);
    renderWithIntl(<WaitingRoom initialRoom={joined} viewerId="Nobara" live />);
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1));

    act(() => FakeEventSource.instances[0].listeners.get('gone')!());
    expect(routerMock.push).toHaveBeenCalledWith('/lobbies');
  });

  it('goes back to the lobby list when the server refuses the entry', async () => {
    lobbyActionsMock.joinLobbyAction.mockResolvedValue(null);
    renderWithIntl(<WaitingRoom initialRoom={joined} viewerId="Nobara" live />);

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/lobbies'));
    expect(FakeEventSource.instances).toHaveLength(0);
  });

  it('starts the race on the server and waits for it before leaving', async () => {
    const ready = { ...LIVE, participants: LIVE.participants.map((p) => (p.kind === 'human' ? { ...p, ready: true } : p)) };
    lobbyActionsMock.joinLobbyAction.mockResolvedValue(ready);
    lobbyActionsMock.updateLobbyAction.mockResolvedValue({ ...ready, status: 'racing' });
    const { user } = renderWithIntl(<WaitingRoom initialRoom={ready} viewerId="Satoru_Infinity" live />);
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1));

    await user.click(screen.getByRole('button', { name: 'Start the race' }));

    expect(lobbyActionsMock.updateLobbyAction).toHaveBeenCalledWith('ABC-DEF', { type: 'start', by: 'Satoru_Infinity' });
    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith('/lobby/ABC-DEF/race'));
  });

  it('records the departure before leaving', async () => {
    lobbyActionsMock.joinLobbyAction.mockResolvedValue(joined);
    const { user } = renderWithIntl(<WaitingRoom initialRoom={joined} viewerId="Nobara" live />);
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1));

    await user.click(screen.getByRole('link', { name: 'Leave the lobby' }));

    expect(lobbyActionsMock.leaveLobbyAction).toHaveBeenCalledWith('ABC-DEF');
    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith('/lobbies'));
  });

  it('asks a visitor without a name to pick one before joining', () => {
    renderWithIntl(<WaitingRoom initialRoom={LIVE} viewerId="" live />);

    expect(screen.getByRole('heading', { name: 'Choose a name' })).toBeInTheDocument();
    expect(lobbyActionsMock.joinLobbyAction).not.toHaveBeenCalled();
  });
});
