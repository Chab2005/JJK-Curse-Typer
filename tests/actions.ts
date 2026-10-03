import { vi } from 'vitest';

// Server actions shared by the @/app/actions/lobbies mock (tests/setup.tsx), so tests can stub and assert them.
export const lobbyActionsMock = {
  createLobbyAction: vi.fn(async (): Promise<string> => 'NEW-LBY'),
  updateLobbyAction: vi.fn<(code: string, action: unknown) => Promise<void>>(async () => {}),
  createInviteAction: vi.fn<(code: string) => Promise<string | null>>(async () => null),
};
