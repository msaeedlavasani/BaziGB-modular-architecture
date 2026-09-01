import { describe, expect, it, vi } from 'vitest';
import { LeaderboardService } from '../src/leaderboard/leaderboard.service';
import { buildStoredGameData } from '../src/history/history.service';

describe('per-game leaderboard', () => {
  it('ranks only the selected game by wins, then win rate', async () => {
    const prisma: any = {
      gameHistory: {
        findMany: vi.fn().mockResolvedValue([
          { winnerId: 'u1', players: JSON.stringify(['u1', 'u2']) },
          { winnerId: 'u2', players: JSON.stringify(['u1', 'u2']) },
          { winnerId: 'u1', players: JSON.stringify(['u1', 'u3']) },
        ]),
      },
      user: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'u1', username: 'Alpha', createdAt: new Date('2025-01-01') },
          { id: 'u2', username: 'Beta', createdAt: new Date('2025-01-02') },
          { id: 'u3', username: 'Gamma', createdAt: new Date('2025-01-03') },
        ]),
      },
    };
    const service = new LeaderboardService(prisma);

    const result = await service.getTopPlayers('tic-tac-toe', 1, 10);

    expect(prisma.gameHistory.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { gameName: 'tic-tac-toe' } }));
    expect(result.items.map((item) => [item.id, item.wins, item.gamesPlayed])).toEqual([
      ['u1', 2, 3],
      ['u2', 1, 2],
      ['u3', 0, 1],
    ]);
  });

  it('stores a versioned minimal summary without raw interaction telemetry', () => {
    const stored = buildStoredGameData({
      roomCode: 'ROOM1',
      gameName: 'tic-tac-toe',
      winnerId: 'u1',
      players: ['u1', 'u2'],
      finalState: { phase: 'finished', winner: 'u1' },
    });

    expect(stored).toEqual(expect.objectContaining({
      schemaVersion: 1,
      summary: expect.objectContaining({ gameName: 'tic-tac-toe', metrics: {} }),
    }));
    expect(stored.summary).not.toHaveProperty('chat');
    expect(stored.summary).not.toHaveProperty('presence');
  });
});
