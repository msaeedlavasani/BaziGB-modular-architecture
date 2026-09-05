import { describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard } from './jwt.guard';

describe('JwtAuthGuard privilege freshness', () => {
  it('attaches the current database role instead of the stale JWT role', async () => {
    const request: any = { headers: { authorization: 'Bearer token' } };
    const auth: any = {
      verify: vi.fn().mockReturnValue({ sub: 'user-1', role: 'ADMIN' }),
      validateUser: vi.fn().mockResolvedValue({
        id: 'user-1',
        username: 'player',
        role: 'USER',
        deactivated: false,
        password: 'not-exposed',
      }),
    };
    const context: any = {
      switchToHttp: () => ({ getRequest: () => request }),
    };

    await expect(new JwtAuthGuard(auth).canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual(expect.objectContaining({ sub: 'user-1', id: 'user-1', role: 'USER' }));
    expect(request.user.password).toBeUndefined();
  });
});
