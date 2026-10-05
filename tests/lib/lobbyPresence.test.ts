import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearLobbies, createLobby, storedLobby, updateLobby } from '@/lib/lobbies';
import { JOIN_GRACE_MS, PRESENCE_GRACE_MS, connectViewer, expectViewer } from '@/lib/lobbyPresence';

const HOST = { id: 'Gojo', name: 'Gojo', avatar: null };
const YUJI = { id: 'Yuji', name: 'Yuji', avatar: null };

let code: string;
const ids = () => storedLobby(code)!.participants.map((p) => p.id);

beforeEach(() => {
  vi.useFakeTimers();
  clearLobbies();
  code = createLobby((host) => host, HOST, Date.now()).code;
  updateLobby(code, { type: 'join', person: YUJI, spectate: false });
});

afterEach(() => vi.useRealTimers());

describe('lobbyPresence', () => {
  it('retire un joueur dont la dernière page du lobby est fermée depuis le délai de grâce', () => {
    const close = connectViewer(code, 'Yuji');
    close();
    vi.advanceTimersByTime(PRESENCE_GRACE_MS - 1);
    expect(ids()).toEqual(['Gojo', 'Yuji']);
    vi.advanceTimersByTime(1);
    expect(ids()).toEqual(['Gojo']);
  });

  it('le garde s’il revient à temps (rechargement, passage à la course)', () => {
    connectViewer(code, 'Yuji')();
    vi.advanceTimersByTime(PRESENCE_GRACE_MS / 2);
    connectViewer(code, 'Yuji');
    vi.advanceTimersByTime(PRESENCE_GRACE_MS * 2);
    expect(ids()).toEqual(['Gojo', 'Yuji']);
  });

  it('le garde tant qu’un autre onglet reste ouvert', () => {
    const first = connectViewer(code, 'Yuji');
    connectViewer(code, 'Yuji');
    first();
    vi.advanceTimersByTime(PRESENCE_GRACE_MS * 2);
    expect(ids()).toEqual(['Gojo', 'Yuji']);
  });

  it('retire quelqu’un qui est entré sans jamais ouvrir de page, après un délai plus long', () => {
    expectViewer(code, 'Yuji');
    vi.advanceTimersByTime(JOIN_GRACE_MS - 1);
    expect(ids()).toEqual(['Gojo', 'Yuji']);
    vi.advanceTimersByTime(1);
    expect(ids()).toEqual(['Gojo']);
  });

  it('ne rallonge pas le délai d’un joueur qui vient de fermer sa page', () => {
    connectViewer(code, 'Yuji')();
    expectViewer(code, 'Yuji');
    vi.advanceTimersByTime(PRESENCE_GRACE_MS);
    expect(ids()).toEqual(['Gojo']);
  });

  it('ne retire pas quelqu’un déjà connecté quand il rentre à nouveau', () => {
    connectViewer(code, 'Yuji');
    expectViewer(code, 'Yuji');
    vi.advanceTimersByTime(PRESENCE_GRACE_MS * 2);
    expect(ids()).toEqual(['Gojo', 'Yuji']);
  });
});
