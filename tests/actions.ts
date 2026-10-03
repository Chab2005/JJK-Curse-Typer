import { vi } from 'vitest';

// Server actions shared by the @/app/actions/lobbies mock (tests/setup.tsx), so tests can stub and assert them.
export const lobbyActionsMock = {
  createLobbyAction: vi.fn<() => Promise<string>>(),
  updateLobbyAction: vi.fn<(code: string, action: unknown) => Promise<void>>(),
};
