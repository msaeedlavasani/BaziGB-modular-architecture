import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AdminGuard } from '../common/admin.guard';
import { Roles } from '../common/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RoomService } from '../rooms/room.service';
import { AdminUpdateUserDto, DeactivateUserDto } from './dto/admin-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomService: RoomService,
  ) {}

  @Get('stats')
  @Roles('ADMIN')
  async getStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      adminUsers,
      newUsersThisWeek,
      totalRooms,
      waitingRooms,
      playingRooms,
      finishedRooms,
      totalGames,
      gamesToday,
      gamesThisWeek,
      gamesByType,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.room.count(),
      this.prisma.room.count({ where: { status: 'waiting' } }),
      this.prisma.room.count({ where: { status: 'playing' } }),
      this.prisma.room.count({ where: { status: 'finished' } }),
      this.prisma.gameHistory.count(),
      this.prisma.gameHistory.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.gameHistory.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.gameHistory.groupBy({
        by: ['gameName'],
        _count: {
          _all: true,
        },
      }),
    ]);

    const byType: Record<string, number> = {};
    gamesByType.forEach((g) => {
      byType[g.gameName] = g._count._all;
    });

    return {
      users: { total: totalUsers, admins: adminUsers, newThisWeek: newUsersThisWeek },
      rooms: { total: totalRooms, waiting: waitingRooms, playing: playingRooms, finished: finishedRooms },
      games: { total: totalGames, today: gamesToday, thisWeek: gamesThisWeek, byType },
    };
  }

  /** Change a user's role (USER <-> ADMIN). Self-demotion is blocked. */
  @Patch('users/:id/role')
  @Roles('ADMIN')
  async setUserRole(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { role?: string },
  ) {
    const role = body?.role;
    if (role !== 'USER' && role !== 'ADMIN') {
      throw new BadRequestException('نقش باید USER یا ADMIN باشد');
    }
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new BadRequestException('کاربر یافت نشد');
    }
    if (id === (req as any).user.id && role !== 'ADMIN') {
      throw new BadRequestException('نمیتوانید نقش حساب خودتان را تغییر دهید');
    }
    await this.prisma.user.update({ where: { id }, data: { role } });
    return { ok: true, id, role };
  }

  @Get('users')
  @Roles('ADMIN')
  async getUsers(
    @Query('q') q?: string,
    @Query('role') role?: string,
    @Query('take') take: string = '50',
    @Query('skip') skip: string = '0',
  ) {
    const takeNum = Math.min(parseInt(take, 10) || 50, 100);
    const skipNum = parseInt(skip, 10) || 0;

    const where: any = {};
    if (role && role !== 'ALL') {
      where.role = role;
    }
    if (q) {
      where.OR = [
        { username: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        take: takeNum,
        skip: skipNum,
        select: {
          id: true,
          email: true,
          username: true,
          phone: true,
          role: true,
          wins: true,
          losses: true,
          rating: true,
          deactivated: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  @Patch('users/:id/reset-stats')
  @Roles('ADMIN')
  async resetUserStats(@Param('id') id: string) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new BadRequestException('کاربر یافت نشد');
    }
    await this.prisma.user.update({
      where: { id },
      data: { wins: 0, losses: 0, rating: 1200 },
    });
    return { ok: true, id };
  }

  @Patch('users/:id/deactivate')
  @Roles('ADMIN')
  async deactivateUser(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: DeactivateUserDto,
  ) {
    if (id === (req as any).user.id) {
      throw new BadRequestException('نمیتوانید حساب خودتان را غیرفعال کنید');
    }
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new BadRequestException('کاربر یافت نشد');
    }
    await this.prisma.user.update({
      where: { id },
      data: { deactivated: body.deactivated },
    });
    return { ok: true, id, deactivated: body.deactivated };
  }

  @Delete('users/:id')
  @Roles('ADMIN')
  async deleteUser(@Req() req: Request, @Param('id') id: string) {
    if (id === (req as any).user.id) {
      throw new BadRequestException('نمیتوانید حساب خودتان را حذف کنید');
    }
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new BadRequestException('کاربر یافت نشد');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.notification.deleteMany({ where: { userId: id } });
      await tx.tournamentPlayer.deleteMany({ where: { userId: id } });
      await tx.tournamentMatch.updateMany({ where: { playerAId: id }, data: { playerAId: null } });
      await tx.tournamentMatch.updateMany({ where: { playerBId: id }, data: { playerBId: null } });
      await tx.tournamentMatch.updateMany({ where: { winnerId: id }, data: { winnerId: null } });
      await tx.tournament.updateMany({ where: { winnerId: id }, data: { winnerId: null } });
      await tx.gameHistory.updateMany({ where: { winnerId: id }, data: { winnerId: null } });
      await tx.user.delete({ where: { id } });
    });

    return { ok: true, id };
  }

  @Patch('users/:id')
  @Roles('ADMIN')
  async updateUser(@Param('id') id: string, @Body() body: AdminUpdateUserDto) {
    const { username, email, phone } = body;
    if (!username && !email && !phone) {
      throw new BadRequestException('حداقل یک فیلد برای ویرایش لازم است');
    }

    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) {
      throw new BadRequestException('کاربر یافت نشد');
    }

    if (username) {
      const existing = await this.prisma.user.findFirst({
        where: {
          username: { equals: username },
          id: { not: id },
        },
      });
      if (existing) throw new BadRequestException('این نام کاربری قبلا انتخاب شده است');
    }

    if (email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: { equals: email },
          id: { not: id },
        },
      });
      if (existing) throw new BadRequestException('این ایمیل قبلا انتخاب شده است');
    }

    if (phone) {
      const existing = await this.prisma.user.findFirst({
        where: {
          phone: { equals: phone },
          id: { not: id },
        },
      });
      if (existing) throw new BadRequestException('این شماره موبایل قبلا انتخاب شده است');
    }

    await this.prisma.user.update({
      where: { id },
      data: { username, email, phone },
    });

    return { ok: true, id };
  }

  @Delete('rooms/:code')
  @Roles('ADMIN')
  async deleteRoom(@Param('code') code: string) {
    const ok = await this.roomService.deleteRoom(code);
    if (!ok) {
      throw new BadRequestException('اتاق یافت نشد');
    }
    return { ok: true, code };
  }
}
