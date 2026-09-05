import { describe, expect, it, vi } from 'vitest';
import { WsRateLimitGuard } from './ws-rate-limit.guard';

function contextFor(client: unknown): any {
  return { switchToWs: () => ({ getClient: () => client }) };
}

describe('WsRateLimitGuard', () => {
  it('keeps the stable address budget across reconnects', () => {
    const calls: string[] = [];
    const limiter: any = {
      isRateLimited: vi.fn((key: string) => {
        calls.push(key);
        return key === 'ws:action:address:198.51.100.4';
      }),
    };
    const guard = new WsRateLimitGuard(limiter);
    const first = { id: 'socket-1', handshake: { address: '198.51.100.4', headers: {} }, emit: vi.fn() };
    const reconnected = { id: 'socket-2', handshake: { address: '198.51.100.4', headers: {} }, emit: vi.fn() };

    expect(guard.canActivate(contextFor(first))).toBe(false);
    expect(guard.canActivate(contextFor(reconnected))).toBe(false);
    expect(calls).toEqual([
      'ws:action:address:198.51.100.4',
      'ws:action:address:198.51.100.4',
    ]);
    expect(reconnected.emit).toHaveBeenCalledWith('error', expect.objectContaining({
      code: 'RATE_LIMIT_EXCEEDED',
    }));
  });

  it('isolates different addresses and retains a per-socket burst budget', () => {
    const limiter: any = { isRateLimited: vi.fn().mockReturnValue(false) };
    const guard = new WsRateLimitGuard(limiter);
    const client = { id: 'socket-3', handshake: { address: '198.51.100.5', headers: {} }, emit: vi.fn() };

    expect(guard.canActivate(contextFor(client))).toBe(true);
    expect(limiter.isRateLimited).toHaveBeenNthCalledWith(
      1, 'ws:action:address:198.51.100.5', 60, 60,
    );
    expect(limiter.isRateLimited).toHaveBeenNthCalledWith(
      2, 'ws:action:socket:socket-3', 20, 10,
    );
  });

  it('uses the right-most forwarded client when one proxy hop is configured', () => {
    const previous = process.env.TRUST_PROXY_HOPS;
    try {
      process.env.TRUST_PROXY_HOPS = '1';
      const limiter: any = { isRateLimited: vi.fn().mockReturnValue(false) };
      const guard = new WsRateLimitGuard(limiter);
      const client = {
        id: 'socket-4',
        handshake: {
          address: '172.20.0.5',
          headers: { 'x-forwarded-for': 'spoofed, 203.0.113.9' },
        },
        emit: vi.fn(),
      };

      expect(guard.canActivate(contextFor(client))).toBe(true);
      expect(limiter.isRateLimited).toHaveBeenNthCalledWith(
        1, 'ws:action:address:203.0.113.9', 60, 60,
      );
    } finally {
      if (previous === undefined) delete process.env.TRUST_PROXY_HOPS;
      else process.env.TRUST_PROXY_HOPS = previous;
    }
  });
});
