import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { HistoryService } from '../history/history.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('game')
export class BotStatsController {
  constructor(
    private readonly historyService: HistoryService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('bot-result')
  @UseGuards(JwtAuthGuard)
  async recordBotResult(@Req() req: any, @Body() body: { gameId: string; winner: 'p1' | 'p2' | null; state: any }) {
    const userId = req.user.id;
    // In local bot games, p1 is always the user, p2/bot is the AI.
    const winnerId = body.winner === 'p1' ? userId : (body.winner === 'p2' ? 'bot' : null);
    
    // Check if a similar bot record was recently created to prevent double counting
    const recent = await this.prisma.room.findFirst({
      where: {
        gameType: body.gameId,
        status: 'finished',
        players: { contains: userId },
        createdAt: { gte: new Date(Date.now() - 5000) } // last 5 seconds
      }
    });
    if (recent) return { ok: true, skipped: true };

    const room = await this.prisma.room.create({
      data: {
        code: `BOT-${Date.now()}-${userId.slice(0, 4)}`,
        gameType: body.gameId,
        status: 'finished',
        players: JSON.stringify([userId, 'bot']),
        currentState: JSON.stringify(body.state),
      },
    });

    return this.historyService.recordGameResult({
      roomCode: room.code,
      gameName: body.gameId,
      winnerId,
      players: [userId, 'bot'],
      finalState: body.state,
    });
  }
}
