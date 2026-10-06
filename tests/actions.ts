import { vi } from 'vitest';
import type { LobbyRoom } from '@/components/lobby/lobbyRoom';

// Server actions shared by the @/app/actions/lobbies mock (tests/setup.tsx), so tests can stub and assert them.
export const lobbyActionsMock = {
  createLobbyAction: vi.fn(async (): Promise<string | null> => 'NEW-LBY'),
  updateLobbyAction: vi.fn<(code: string, action: unknown) => Promise<LobbyRoom | null>>(async () => null),
  joinLobbyAction: vi.fn<(code: string, options?: { spectate?: boolean; invite?: string }) => Promise<LobbyRoom | null>>(async () => null),
  leaveLobbyAction: vi.fn<(code: string) => Promise<void>>(async () => {}),
  createInviteAction: vi.fn<(code: string) => Promise<string | null>>(async () => null),
};

// Auth actions (@/app/actions/auth): the pieces components call directly.
export const authActionsMock = {
  setGuestNameAction: vi.fn<(name: string) => Promise<'length' | 'characters' | 'account' | null>>(async () => null),
  logoutAction: vi.fn(async () => {}),
  loginAction: vi.fn(async () => null),
  registerAction: vi.fn(async () => null),
  completeOAuthAction: vi.fn(async () => null),
  saveSettingsAction: vi.fn(async () => null),
};
