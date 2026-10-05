import { afterEach, describe, expect, it, vi } from 'vitest';
import { findLobby } from '@/lib/lobbies';
import { showSampleData } from '@/lib/sampleData';

afterEach(() => vi.unstubAllEnvs());

describe('showSampleData', () => {
  it('is on in development and test', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(showSampleData()).toBe(true);
  });

  it('is off in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(showSampleData()).toBe(false);
  });

  it('can be switched back on in production with SHOW_SAMPLE_DATA=1', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SHOW_SAMPLE_DATA', '1');
    expect(showSampleData()).toBe(true);
  });
});

describe('findLobby and the demo lobbies', () => {
  it('opens a demo lobby outside production, and answers unknown in production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(findLobby('SHJ-60S', 'someone', false)).not.toBeNull();

    vi.stubEnv('NODE_ENV', 'production');
    expect(findLobby('SHJ-60S', 'someone', false)).toBeNull();
  });
});
