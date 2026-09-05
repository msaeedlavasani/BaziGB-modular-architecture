import { describe, expect, it, vi } from 'vitest';
import { HttpException, ServiceUnavailableException } from '@nestjs/common';
import { RoomsController } from './room.controller';
import { RoomService } from './room.service';
import { RateLimiterService } from '../common/rate-limiter.service';

describe('Private Alpha room growth controls', () => {
  it('bounds public room listings to the newest 100 rows', async () => {
    const prisma: any = { room: { findMany: vi.fn().mockResolvedValue([]) } };
    const service = new RoomService(prisma);

    await service.listRooms('waiting');

    expect(prisma.room.findMany).toHaveBeenCalledWith({
      where: { status: 'waiting' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  });

  it('cleans abandoned empty rooms and fails closed at the active-room quota', async () => {
    const prisma: any = {
      room: {
        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
        count: vi.fn().mockResolvedValue(200),
        create: vi.fn(),
      },
    };
    const service = new RoomService(prisma);

    await expect(service.createRoom('chess', 1)).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.room.deleteMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: 'waiting', players: '[]' }),
    }));
    expect(prisma.room.create).not.toHaveBeenCalled();
  });

  it('rate-limits the only remaining persistent room-creation endpoint', async () => {
    const roomService: any = { createRoom: vi.fn() };
    const limiter: any = { isRateLimited: vi.fn().mockReturnValue(true) };
    const controller = new RoomsController(roomService, limiter);

    expect(() => controller.createRoom({ socket: { remoteAddress: '198.51.100.1' } }, 'chess', 1)).toThrow(HttpException);
    expect(roomService.createRoom).not.toHaveBeenCalled();
  });

  it('isolates normal room-creation budgets by trusted client address', () => {
    const roomService: any = { createRoom: vi.fn().mockReturnValue({ code: 'ROOM1' }) };
    const counts = new Map<string, number>();
    const limiter: any = {
      isRateLimited: vi.fn((key: string, limit: number) => {
        const count = counts.get(key) ?? 0;
        counts.set(key, count + 1);
        return count >= limit;
      }),
    };
    const controller = new RoomsController(roomService, limiter);
    const first = { socket: { remoteAddress: '198.51.100.1' } };
    const second = { socket: { remoteAddress: '198.51.100.2' } };

    for (let i = 0; i < 5; i++) controller.createRoom(first, 'chess', 1);
    expect(() => controller.createRoom(first, 'chess', 1)).toThrow(HttpException);
    expect(() => controller.createRoom(second, 'chess', 1)).not.toThrow();
  });

  it('uses the configured proxy hop and ignores a caller-prepended address', () => {
    const roomService: any = { createRoom: vi.fn().mockReturnValue({ code: 'ROOM1' }) };
    const limiter: any = { isRateLimited: vi.fn().mockReturnValue(false) };
    const controller = new RoomsController(roomService, limiter);

    const previous = process.env.TRUST_PROXY_HOPS;
    try {
      process.env.TRUST_PROXY_HOPS = '1';
      controller.createRoom({
        socket: { remoteAddress: '172.20.0.5' },
        headers: { 'x-forwarded-for': 'spoofed, 203.0.113.7' },
      }, 'chess', 1);
      expect(limiter.isRateLimited).toHaveBeenCalledWith(
        'http:rooms:create:address:203.0.113.7', 5, 900,
      );
    } finally {
      if (previous === undefined) delete process.env.TRUST_PROXY_HOPS;
      else process.env.TRUST_PROXY_HOPS = previous;
    }
  });

  it('does not let an already-limited caller consume the global allowance', () => {
    const roomService: any = { createRoom: vi.fn().mockReturnValue({ code: 'ROOM1' }) };
    const limiter = new RateLimiterService();
    const controller = new RoomsController(roomService, limiter);
    const first = { socket: { remoteAddress: '198.51.100.10' } };
    const second = { socket: { remoteAddress: '198.51.100.11' } };

    for (let i = 0; i < 5; i++) controller.createRoom(first, 'chess', 1);
    for (let i = 0; i < 100; i++) {
      expect(() => controller.createRoom(first, 'chess', 1)).toThrow(HttpException);
    }
    expect(() => controller.createRoom(second, 'chess', 1)).not.toThrow();
  });
});
