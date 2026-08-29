import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RoomService } from '../rooms/room.service';
import { BadRequestException } from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('AdminController', () => {
  let controller: AdminController;
  let roomService: RoomService;

  beforeEach(() => {
    roomService = {
      deleteRoom: vi.fn(),
      deleteRoomsBulk: vi.fn(),
    } as unknown as RoomService;
    controller = new AdminController({} as PrismaService, roomService);
  });

  describe('deleteRoomsBulk', () => {
    it('should delete rooms and return count', async () => {
      const codes = ['ROOM1', 'ROOM2'];
      vi.spyOn(roomService, 'deleteRoomsBulk').mockResolvedValue(2);

      const result = await controller.deleteRoomsBulk(codes);

      expect(result).toEqual({ ok: true, count: 2 });
      expect(roomService.deleteRoomsBulk).toHaveBeenCalledWith(codes);
    });

    it('should throw BadRequestException if codes is not an array', async () => {
      await expect(controller.deleteRoomsBulk('not-an-array' as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if codes array is empty', async () => {
      await expect(controller.deleteRoomsBulk([])).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteRoom', () => {
    it('should delete a room with spaces in the code', async () => {
      const roomCode = 'DOCUMENTATION BLOAT';
      vi.spyOn(roomService, 'deleteRoom').mockResolvedValue(true);

      const result = await controller.deleteRoom(roomCode);

      expect(roomService.deleteRoom).toHaveBeenCalledWith(roomCode);
      expect(result).toEqual({ ok: true, code: roomCode });
    });
  });
});
