import { act, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import RaceScreen from '@/components/race/RaceScreen';
import type { ClientMessage, RaceSnapshot, ServerMessage } from '@/game/protocol';
import type { RacerSeat, Standing } from '@/game/race';
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
}

const SEATS: RacerSeat[] = [
  { id: 'Megumi_Shadows', name: 'Megumi_Shadows', avatar: 'megumi', kind: 'human', level: null },
  { id: 'Yuji_BlackFlash', name: 'Yuji_BlackFlash', avatar: 'yuji', kind: 'human', level: null },
  { id: 'bot-1', name: '1', avatar: null, kind: 'bot', level: 'expert' },
];

const race = (overrides: Partial<RaceSnapshot> = {}): RaceSnapshot => ({
  phase: 'racing',
  startsIn: -1000,
  timerMs: 0,
  bonus: false,
  text: 'abc def',
  mode: 'accumulate',
  seats: SEATS,
  ...overrides,
});

const standing = (id: string, rank: number, status: Standing['status'] = 'racing'): Standing => ({ id, rank, progress: 0, wpm: 40, accuracy: 1, energy: 120, status, endedAt: null });

let socket: FakeWebSocket;

function start(welcome: Partial<Extract<ServerMessage, { type: 'welcome' }>> = {}) {
  const view = renderWithIntl(<RaceScreen code="TKY-HGH" lobbyName="Tokyo Jujutsu High" />);
  socket = FakeWebSocket.instances.at(-1)!;
  socket.open();
  socket.receive({ type: 'welcome', you: 'Megumi_Shadows', race: race(), typing: null, ...welcome });
  return view;
}

beforeEach(() => {
  FakeWebSocket.instances = [];
  vi.stubGlobal('WebSocket', FakeWebSocket);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('RaceScreen', () => {
  it('connects to the lobby race socket and joins with a guest id', () => {
    renderWithIntl(<RaceScreen code="TKY-HGH" lobbyName="Tokyo Jujutsu High" />);
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

  it('sends the typed keys to the server, which holds the truth (RACE-14)', async () => {
    const { user } = start();

    await user.type(screen.getByLabelText('Type the text'), 'ab');
    await waitFor(() => expect(socket.sent.find((m) => m.type === 'keys')).toBeDefined());
    const keys = socket.sent.filter((m) => m.type === 'keys').flatMap((m) => m.strokes.map((s) => s.key));
    expect(keys).toEqual(['a', 'b']);
  });

  it('replaces the local text with the server’s after a refused batch', () => {
    const { container } = start();

    socket.receive({
      type: 'resync',
      typing: { text: 'abc def', mode: 'accumulate', input: 'ab', keystrokes: 2, errors: 0, streak: 2, peak: 2, lastT: 400, finishedAt: null },
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

    const table = screen.getByRole('table', { name: 'Results' });
    expect(within(table).getByText('Cursed corpse 1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the lobby' })).toBeInTheDocument();
  });
});
