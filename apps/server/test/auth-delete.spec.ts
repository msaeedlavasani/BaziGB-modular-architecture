import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../src/auth/auth.service';

describe('OTP account deletion', () => {
  it('removes direct identifiers while keeping an anonymous deactivated row', async () => {
    const prisma: any = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'u1', phone: '09123456789' }),
        update: vi.fn().mockResolvedValue({}),
      },
      otpCode: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
      notification: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
      $transaction: vi.fn().mockResolvedValue([]),
    };
    const service = new AuthService(prisma, {} as any, {} as any);

    await service.deleteMe('u1');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: expect.objectContaining({
        email: null,
        phone: null,
        password: null,
        deactivated: true,
      }),
    });
  });
});
