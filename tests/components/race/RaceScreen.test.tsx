import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RaceScreen from '@/components/race/RaceScreen';
import type { ClientMessage, RaceSnapshot, ServerMessage } from '@/game/protocol';
import { startPowers } from '@/game/powers';
import { COUNTDOWN_MS, type RacerSeat, type Standing } from '@/game/race';
import { startTyping } from '@/game/typing';
import { lobbyActionsMock, raceActionsMock } from '../../actions';
import { renderWithIntl } from '../../render';
import { routerMock } from '../../router';

// Fake WebSocket: the test plays the race server.
class FakeWebSocket {
  static readonly OPEN = 1;
  static instances: FakeWebSocket[] = [];
  readyState = 0;
  sent: ClientMessage[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this);
  }
  send(data: string) {
    this.sent.push(JSON.parse(data));
  }
  close() {
    this.readyState = 3;
  }
  open() {
    this.readyState = FakeWebSocket.OPEN;
    act(() => this.onopen?.());
  }
  receive(message: ServerMessage) {
    act(() => this.onmessage?.({ data: JSON.stringify(message) }));
  }
  drop() {
    this.readyState = 3;
    act(() => this.onclose?.());
  }
}

const SEATS: RacerSeat[] = [
  { id: 'Megumi_Shadows', name: 'Megumi_Shadows', avatar: 'megumi', kind: 'human', level: null },
  { id: 'Yuji_BlackFlash', name: 'Yuji_BlackFlash', avatar: 'yuji', kind: 'human', level: null },
  { id: 'bot-1', name: '1', avatar: null, kind: 'bot', level: 'grade_1' },
];

const race = (overrides: Partial<RaceSnapshot> = {}): RaceSnapshot => ({
  phase: 'racing',
  startsIn: -1000,
  timerMs: 0,
  bonus: false,
  gameMode: 'heavenly',
  text: 'abc def',
  mode: 'accumulate',
  seats: SEATS,
  ...overrides,
});

const standing = (id: string, rank: number, status: Standing['status'] = 'racing'): Standing => ({ id, rank, progress: 0, total: 7, wpm: 40, rawWpm: 42, errors: 0, received: 0, accuracy: 1, energy: 120, status, endedAt: null, marks: [] });

let socket: FakeWebSocket;

function start(welcome: Partial<Extract<ServerMessage, { type: 'welcome' }>> = {}) {
  const view = renderWithIntl(<RaceScreen code="TKY-HGH" lobbyName="Tokyo Jujutsu High" account={{ username: 'megumi', displayName: 'Megumi', avatarUrl: null }} />);
  socket = FakeWebSocket.instances.at(-1)!;
  socket.open();
  socket.receive({ type: 'welcome', you: 'Megumi_Shadows', race: race(), typing: null, ...welcome });
  return view;
}

beforeEach(() => {
  raceActionsMock.claimRaceResultsAction.mockClear();
  FakeWebSocket.instances = [];
  vi.stubGlobal('WebSocket', FakeWebSocket);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('RaceScreen', () => {
  it('connects to the lobby race socket and joins with a guest id', () => {
    renderWithIntl(<RaceScreen code="TKY-HGH" lobbyName="Tokyo Jujutsu High" account={{ username: 'megumi', displayName: 'Megumi', avatarUrl: null }} />);
    expect(screen.getByText('Connecting to the race…')).toBeInTheDocument();

    const [ws] = FakeWebSocket.instances;
    expect(ws.url).toBe('ws://localhost:3000/ws/race/TKY-HGH');
    ws.open();
    expect(ws.sent[0]).toEqual({ type: 'join', guest: expect.stringMatching(/^.{8,64}$/) });
  });

  it('shows the countdown before the start (RACE-1)', () => {
    start({ race: race({ phase: 'countdown', startsIn: 2500 }) });

    expect(screen.getByRole('status', { name: 'Countdown' })).toHaveTextContent('3');
  });

  it('shows 3, 2, 1 and reveals the text, unblurred, once the countdown starts (COURSE-03)', () => {
    renderWithIntl(<RaceScreen code="TKY-HGH" lobbyName="Tokyo Jujutsu High" account={{ username: 'megumi', displayName: 'Megumi', avatarUrl: null }} />);
    expect(screen.queryByText('abc def')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Type the text')).not.toBeInTheDocument();

    socket = FakeWebSocket.instances.at(-1)!;
    socket.open();
    socket.receive({ type: 'welcome', you: 'Megumi_Shadows', race: race({ phase: 'countdown', startsIn: COUNTDOWN_MS - 500 }), typing: null });
    expect(screen.getByRole('status', { name: 'Countdown' })).toHaveTextContent('3');
    expect(screen.getByLabelText('Type the text').closest('.blur-\\[2px\\]')).toBeNull();
  });

  it('shows the player live WPM and accuracy during the race (COURSE-04)', () => {
    start({ you: 'Megumi_Shadows' });
    socket.receive({ type: 'tick', phase: 'racing', elapsed: 5000, standings: [{ ...standing('Megumi_Shadows', 1), wpm: 64, accuracy: 0.92 }] });
    const live = screen.getByRole('group', { name: 'Live stats' });
    expect(live).toHaveTextContent('64');
    expect(live).toHaveTextContent('92%');
  });

  it('sends the typed keys to the server, which holds the truth (RACE-14)', async () => {
    const { user } = start();

    await user.type(screen.getByLabelText('Type the text'), 'ab');
    // Keys are sent in batches: they may arrive in one message or several.
    const sentKeys = () => socket.sent.flatMap((m) => (m.type === 'keys' ? m.strokes.map((s) => s.key) : []));
    await waitFor(() => expect(sentKeys()).toEqual(['a', 'b']));
  });

  it('keeps the keys typed during a disconnection and sends them after reconnecting (RACE-13)', async () => {
    const { user, container } = start();
    socket.drop();

    await user.type(screen.getByLabelText('Type the text'), 'ab');
    expect(screen.getByText('Connection lost, reconnecting…')).toBeInTheDocument();
    await waitFor(() => expect(FakeWebSocket.instances).toHaveLength(2), { timeout: 2000 });
    const next = FakeWebSocket.instances[1];
    next.open();
    next.receive({ type: 'welcome', you: 'Megumi_Shadows', race: race(), typing: startTyping('abc def', 'accumulate') });

    // The server never got the keys: they are replayed on its text, then sent.
    expect(container.querySelector('[data-caret]')).toHaveTextContent('c');
    const sentKeys = () => next.sent.flatMap((m) => (m.type === 'keys' ? m.strokes.map((s) => s.key) : []));
    await waitFor(() => expect(sentKeys()).toEqual(['a', 'b']));
  });

  it('replaces the local text with the server’s after a refused batch', () => {
    const { container } = start();

    socket.receive({
      type: 'resync',
      typing: { text: 'abc def', mode: 'accumulate', input: 'ab', keystrokes: 2, errors: 0, streak: 2, peak: 2, lastT: 400, finishedAt: null },
      acked: 0,
      powers: startPowers(),
    });
    expect(container.querySelector('[data-caret]')).toHaveTextContent('c');
  });

  it('shows the energy bar only when bonuses are on (BON-1)', () => {
    start({ race: race({ bonus: true }) });
    socket.receive({ type: 'tick', phase: 'racing', elapsed: 1200, standings: [standing('Megumi_Shadows', 1)] });

    expect(screen.getByRole('meter', { name: 'Energy' })).toHaveAttribute('aria-valuenow', '120');
  });

  it('hides the energy bar when bonuses are off', () => {
    start();

    expect(screen.queryByRole('meter', { name: 'Energy' })).not.toBeInTheDocument();
  });

  it.each(['sukuna', 'yuta', 'gojo'] as const)('uses the player character for %s energy', (avatar) => {
    start({ race: race({ bonus: true, seats: [{ ...SEATS[0], avatar }, ...SEATS.slice(1)] }) });
    expect(screen.getByRole('meter', { name: 'Energy' })).toHaveAttribute('data-affinity', avatar === 'sukuna' ? 'sukuna' : avatar === 'yuta' ? 'yuta' : 'default');
  });

  it('puts late arrivals in spectator mode', () => {
    start({ you: null });

    expect(screen.getByRole('heading', { name: 'Spectator mode' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Type the text')).not.toBeInTheDocument();
  });

  it('abandons after a confirmation (RACE-10)', async () => {
    const { user } = start();

    await user.click(screen.getByRole('button', { name: 'Abandon' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Abandon the race?' })).getByRole('button', { name: 'Abandon' }));
    expect(socket.sent).toContainEqual({ type: 'abandon' });
  });

  it('asks before leaving through the header, then abandons and leaves', async () => {
    const { user } = start();

    await user.click(screen.getByRole('link', { name: 'My profile' }));
    await user.click(screen.getByRole('button', { name: 'Abandon and leave' }));
    expect(socket.sent).toContainEqual({ type: 'abandon' });
    expect(routerMock.push).toHaveBeenCalledWith('/profile');
  });

  it('shows the results once the race is over (RACE-14)', () => {
    start();
    socket.receive({
      type: 'tick',
      phase: 'finished',
      elapsed: 30_000,
      standings: [standing('Yuji_BlackFlash', 1, 'finished'), standing('bot-1', 2, 'finished'), standing('Megumi_Shadows', 3, 'timeout')],
    });

    expect(screen.getByText('Yuji_BlackFlash wins the race!')).toBeInTheDocument();
    const podium = screen.getByRole('region', { name: 'Race podium' });
    expect(within(podium).getByText('Cursed corpse 1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the lobby' })).toBeInTheDocument();
  });

  const finish = () =>
    socket.receive({
      type: 'tick',
      phase: 'finished',
      elapsed: 30_000,
      standings: [standing('Megumi_Shadows', 1, 'finished'), standing('bot-1', 2, 'finished'), standing('Yuji_BlackFlash', 3, 'timeout')],
    });

  it('a seated guest claims its result for its cookie once the race is over, only once (STAT-6)', () => {
    renderWithIntl(<RaceScreen code="ABC-DEF" lobbyName="Lobby" live ticket="t" />);
    socket = FakeWebSocket.instances.at(-1)!;
    socket.open();
    socket.receive({ type: 'welcome', you: 'Megumi_Shadows', race: race(), typing: null });
    expect(raceActionsMock.claimRaceResultsAction).not.toHaveBeenCalled();

    finish();
    finish();
    expect(raceActionsMock.claimRaceResultsAction).toHaveBeenCalledTimes(1);
  });

  it('shows the personal-best badge the room announces once the race is saved (RES-04)', () => {
    start();
    finish();
    socket.receive({ type: 'records', seats: ['Megumi_Shadows'] });
    const table = within(screen.getByRole('table', { name: 'Results' }));
    const row = table.getByText('Megumi_Shadows').closest('tr')!;
    expect(within(row).getByTestId('record-badge')).not.toHaveClass('invisible');
  });

  it('shows a guest its personal best from the claimed result (RES-04)', async () => {
    raceActionsMock.claimRaceResultsAction.mockResolvedValueOnce({ record: true });
    renderWithIntl(<RaceScreen code="ABC-DEF" lobbyName="Lobby" live ticket="t" />);
    socket = FakeWebSocket.instances.at(-1)!;
    socket.open();
    socket.receive({ type: 'welcome', you: 'Megumi_Shadows', race: race(), typing: null });
    finish();
    const row = within(screen.getByRole('table', { name: 'Results' })).getByText('Megumi_Shadows').closest('tr')!;
    await waitFor(() => expect(within(row).getByTestId('record-badge')).not.toHaveClass('invisible'));
  });

  it('an account claims nothing: the race server already saved its result (STAT-8)', () => {
    renderWithIntl(<RaceScreen code="ABC-DEF" lobbyName="Lobby" live ticket="t" account={{ username: 'megumi', displayName: 'Megumi', avatarUrl: null }} />);
    socket = FakeWebSocket.instances.at(-1)!;
    socket.open();
    socket.receive({ type: 'welcome', you: 'Megumi_Shadows', race: race(), typing: null });
    finish();
    expect(raceActionsMock.claimRaceResultsAction).not.toHaveBeenCalled();
  });

  describe('results screen of a created lobby (COURSE-11)', () => {
    class FakeEventSource {
      static CLOSED = 2;
      static instances: FakeEventSource[] = [];
      readyState = 1;
      onmessage: ((event: { data: string }) => void) | null = null;
      onerror: (() => void) | null = null;
      listeners = new Map<string, (event: { data: string }) => void>();
      constructor(public url: string) {
        FakeEventSource.instances.push(this);
      }
      addEventListener(type: string, listener: (event: { data: string }) => void) {
        this.listeners.set(type, listener);
      }
      close() {
        this.readyState = FakeEventSource.CLOSED;
      }
    }
    const lobby = (status: string, hostId = 'Megumi_Shadows') => ({ data: JSON.stringify({ code: 'ABC-DEF', status, hostId, participants: [], spectators: [], banned: [], settings: {} }) });

    function finishedLive(viewerId: string) {
      FakeEventSource.instances = [];
      vi.stubGlobal('EventSource', FakeEventSource);
      const view = renderWithIntl(<RaceScreen code="ABC-DEF" lobbyName="Lobby" live ticket="t" viewerId={viewerId} hostId="Megumi_Shadows" />);
      socket = FakeWebSocket.instances.at(-1)!;
      socket.open();
      socket.receive({ type: 'welcome', you: viewerId, race: race(), typing: null });
      finish();
      const stream = FakeEventSource.instances[0];
      act(() => stream.onmessage!(lobby('results')));
      return { ...view, stream };
    }

    it('passes the seat ticket in the socket URL (SALLE-10)', () => {
      finishedLive('Megumi_Shadows');
      expect(socket.url).toBe('ws://localhost:3000/ws/race/ABC-DEF?ticket=t');
    });

    it('lets the host restart: everyone goes back to the waiting room', async () => {
      lobbyActionsMock.updateLobbyAction.mockResolvedValue(null);
      const { user, stream } = finishedLive('Megumi_Shadows');

      expect(screen.queryByRole('link', { name: 'Back to the lobby' })).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Restart the race' }));
      expect(lobbyActionsMock.updateLobbyAction).toHaveBeenCalledWith('ABC-DEF', { type: 'restart' });

      act(() => stream.onmessage!(lobby('waiting')));
      expect(routerMock.push).toHaveBeenCalledWith('/lobby/ABC-DEF');
    });

    it('lets the host close the lobby after a confirmation', async () => {
      lobbyActionsMock.updateLobbyAction.mockResolvedValue(null);
      const { user } = finishedLive('Megumi_Shadows');

      await user.click(screen.getByRole('button', { name: 'Close the lobby' }));
      await user.click(within(screen.getByRole('dialog', { name: 'Close the lobby?' })).getByRole('button', { name: 'Close the lobby' }));
      expect(lobbyActionsMock.updateLobbyAction).toHaveBeenCalledWith('ABC-DEF', { type: 'close' });
      await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith('/lobbies?closed=1'));
    });

    it('shows the other players a waiting line, and sends them out with a message when the host closes', async () => {
      lobbyActionsMock.leaveLobbyAction.mockResolvedValue();
      const { stream } = finishedLive('Yuji_BlackFlash');

      expect(screen.getByText('Waiting for the host to restart the race or close the lobby…')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Restart the race' })).not.toBeInTheDocument();

      act(() => stream.listeners.get('gone')!({ data: 'closed' }));
      expect(routerMock.push).toHaveBeenCalledWith('/lobbies?closed=1');
    });

    it('gives the buttons to the new host when the host role passes', () => {
      const { stream } = finishedLive('Yuji_BlackFlash');
      act(() => stream.onmessage!(lobby('results', 'Yuji_BlackFlash')));
      expect(screen.getByRole('button', { name: 'Restart the race' })).toBeInTheDocument();
    });
  });

  describe('casting (BON-*)', () => {
    const TEXT = 'abc def ghi';
    const ready = async () => {
      const view = start({ you: 'Megumi_Shadows', race: race({ bonus: true, gameMode: 'normal', text: TEXT }) });
      socket.receive({ type: 'tick', phase: 'racing', elapsed: 1000, standings: [{ ...standing('Megumi_Shadows', 1), energy: 1500 }, standing('Yuji_BlackFlash', 2)] });
      await waitFor(() => expect(screen.getByLabelText('Type the text')).toHaveFocus());
      return { ...view, field: screen.getByLabelText('Type the text') };
    };
    const alt = (field: HTMLElement, code: string) => fireEvent.keyDown(field, { altKey: true, code, key: '∑' });
    const typed = (field: HTMLElement, text: string) => {
      for (const char of text) fireEvent.input(field, { target: { value: char } });
    };
    const casts = () => socket.sent.filter((m) => m.type === 'cast');

    it('opens the window on Alt+W, keeps the focus on the text, and casts once the name is typed', async () => {
      const { field } = await ready();
      alt(field, 'KeyW');
      expect(screen.getByRole('dialog', { name: 'Type your ability' })).toBeInTheDocument();
      expect(field).toHaveFocus();

      typed(field, 'Toad');
      expect(casts()).toEqual([{ type: 'cast', ability: 'toad' }]);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(field).toHaveFocus();
    });

    it('shows one line that completes what is typed, with its CE cost', async () => {
      const { field } = await ready();
      alt(field, 'KeyW');
      expect(screen.getByTestId('cast-line')).toHaveTextContent('Rabbit Escape');
      expect(screen.getByText('100 CE')).toBeInTheDocument();

      typed(field, 'T');
      expect(screen.getByTestId('cast-line')).toHaveTextContent('Toad');
      expect(screen.getByText('450 CE')).toBeInTheDocument();
      expect(screen.queryByText('Rabbit Escape')).not.toBeInTheDocument();
    });

    it('sends the typed name to the window, not to the race text', async () => {
      const { field, container } = await ready();
      alt(field, 'KeyW');
      typed(field, 'To');
      expect(container.querySelector('[data-caret]')).toHaveTextContent('a');
      expect(socket.sent.some((m) => m.type === 'keys')).toBe(false);
    });

    it('cannot be closed by the player, but a mistake after the grace closes it for free', async () => {
      const { field } = await ready();
      alt(field, 'KeyW');
      fireEvent.keyDown(field, { key: 'Escape' });
      fireEvent.mouseDown(screen.getByRole('dialog'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      typed(field, 'Toax');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(casts()).toEqual([]);
      expect(await screen.findByText('Cast failed: wrong name')).toBeInTheDocument();
      typed(field, 'a');
      await waitFor(() => expect(socket.sent.some((m) => m.type === 'keys')).toBe(true));
    });

    it('asks for the whole incantation for Mahoraga', async () => {
      const { field } = await ready();
      alt(field, 'KeyW');
      typed(field, 'With this treasure, I summon...  Eight-Handled Sword Divergent Sila Divine General Mahoraga');
      expect(casts()).toEqual([{ type: 'cast', ability: 'mahoraga' }]);
    });

    it('opens the domain with Alt+Q and makes the vow at once with Alt+X', async () => {
      const { field } = await ready();
      alt(field, 'KeyQ');
      typed(field, 'Chimera Shadow Garden');
      alt(field, 'KeyX');
      expect(casts()).toEqual([{ type: 'cast', ability: 'domain' }, { type: 'cast', ability: 'vow' }]);
    });

    it('says why when nothing can be cast', async () => {
      const { field } = await ready();
      socket.receive({ type: 'tick', phase: 'racing', elapsed: 1200, standings: [{ ...standing('Megumi_Shadows', 1), energy: 50 }] });
      alt(field, 'KeyW');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(await screen.findByText('Not enough cursed energy')).toBeInTheDocument();
    });

    it('replays unconfirmed keys on the text the server changed', async () => {
      const { field, container } = await ready();
      typed(field, 'ab');
      socket.receive({ type: 'sync', typing: startTyping(`${TEXT} extra`, 'accumulate'), acked: 0, powers: startPowers() });
      expect(container.querySelector('[data-caret]')).toHaveTextContent('c');
      expect(screen.getByText(`${TEXT} extra`)).toBeInTheDocument();
    });

    it('blocks typing while stunned, and a stun interrupts the window', async () => {
      const { field, container } = await ready();
      alt(field, 'KeyW');
      socket.receive({ type: 'sync', typing: startTyping(TEXT, 'accumulate'), acked: 0, powers: { ...startPowers(), stun: { from: 0, until: 600_000 } } });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Stunned');
      typed(field, 'a');
      expect(container.querySelector('[data-caret]')).toHaveTextContent('a');
    });

    it('announces what other players cast', async () => {
      await ready();
      socket.receive({
        type: 'tick',
        phase: 'racing',
        elapsed: 1200,
        standings: [standing('Yuji_BlackFlash', 1)],
        notices: [{ kind: 'cast', by: 'Yuji_BlackFlash', ability: 'blackFlash', target: 'Megumi_Shadows', outcome: 'hit' }],
      });
      expect(await screen.findByText('Yuji_BlackFlash hits Megumi_Shadows with Black Flash')).toBeInTheDocument();
    });

    it('spreads an open domain behind the whole screen until it closes', async () => {
      await ready();
      const domain = (open: boolean) => socket.receive({ type: 'tick', phase: 'racing', elapsed: 1200, standings: [], notices: [{ kind: 'domain', by: 'Yuji_BlackFlash', character: 'gojo', open }] });
      domain(true);
      expect(screen.getByTestId('race-domain')).toBeInTheDocument();
      domain(false);
      expect(screen.queryByTestId('race-domain')).not.toBeInTheDocument();
    });

    it('drops an open domain when the race ends', async () => {
      await ready();
      socket.receive({ type: 'tick', phase: 'racing', elapsed: 1200, standings: [], notices: [{ kind: 'domain', by: 'Yuji_BlackFlash', character: 'gojo', open: true }] });
      socket.receive({ type: 'tick', phase: 'finished', elapsed: 1400, standings: [standing('Megumi_Shadows', 1, 'finished')] });
      expect(screen.queryByTestId('race-domain')).not.toBeInTheDocument();
    });

    it('shows the clock only in a timed race, and Abandon below the text', () => {
      start({ race: race({ timerMs: 60_000 }) });
      expect(screen.getByText('Time left')).toBeInTheDocument();
      const text = screen.getByLabelText('Type the text');
      const abandon = screen.getByRole('button', { name: 'Abandon' });
      expect(text.compareDocumentPosition(abandon) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('hides the clock in an untimed race', () => {
      start();
      expect(screen.queryByText('Time left')).not.toBeInTheDocument();
      expect(screen.queryByText('Time')).not.toBeInTheDocument();
    });

    it('gives Maki neither energy nor abilities', () => {
      const seats: RacerSeat[] = [{ ...SEATS[0], avatar: 'maki' }, SEATS[1]];
      start({ race: race({ bonus: true, gameMode: 'normal', seats }) });
      expect(screen.queryByRole('button', { name: /Technique/ })).not.toBeInTheDocument();
      expect(screen.queryByText('Cursed energy')).not.toBeInTheDocument();
    });
  });
});
