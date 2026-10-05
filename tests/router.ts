import { vi } from 'vitest';

// Router shared by the @/i18n/navigation mock (tests/setup.tsx), so tests can assert navigations.
export const routerMock = { push: vi.fn(), replace: vi.fn() };
