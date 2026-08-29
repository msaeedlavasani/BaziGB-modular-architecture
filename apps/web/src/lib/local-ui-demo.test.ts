import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadPolicy() {
  vi.resetModules();
  return import('./local-ui-demo');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('local UI demo policy', () => {
  it('requires an explicit development switch', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_BAZIGB_UI_DEMOS', 'leaderboard');

    const { isLocalUiDemoEnabled } = await loadPolicy();

    expect(isLocalUiDemoEnabled('leaderboard')).toBe(true);
    expect(isLocalUiDemoEnabled('tournaments')).toBe(false);
  });

  it('is disabled by default in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_BAZIGB_UI_DEMOS', '');

    const { isLocalUiDemoEnabled } = await loadPolicy();

    expect(isLocalUiDemoEnabled('leaderboard')).toBe(false);
  });

  it('is fail-closed in production even when the public switch is set', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_BAZIGB_UI_DEMOS', 'leaderboard,tournaments');

    const { isLocalUiDemoEnabled } = await loadPolicy();

    expect(isLocalUiDemoEnabled('leaderboard')).toBe(false);
    expect(isLocalUiDemoEnabled('tournaments')).toBe(false);
  });
});
