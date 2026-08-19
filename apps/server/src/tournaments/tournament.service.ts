import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TournamentMatch } from '@prisma/client';

export type TournamentStatus = 'registration' | 'seeded' | 'in_progress' | 'completed';

export interface CreateTournamentInput {
  name: string;
  gameType?: string;
  maxPlayers?: number;
  playerIds?: string[];
}

/** In-memory copy of one bracket match used during seeding simulation. */
interface SimMatch {
  id: string;
  round: number; // 1-based
  index: number; // 0-based within the round
  a: string | null;
  b: string | null;
  winner: string | null;
  status: 'pending' | 'completed' | 'phantom';
  nextId: string | null;
}

/**
 * Single-elimination knockout tournaments.
 *
 * Lifecycle: registration -> seeded -> in_progress -> completed
 *
 * Bracket shape (persisted in `Tournament.bracket`):
 *   rounds: 1-based; round r has 2^(numRounds - r) matches, `bracketIndex` is
 *   the 0-based position inside the round. Match (r, i) feeds into
 *   match (r+1, floor(i / 2)), so `nextMatchId` points at the parent slot.
 *
 * Seeding: registered players are shuffled (Fisher-Yates) and seated into the
 * first-round slots in order. When there are fewer players than bracket slots
 * (non-power-of-two fields), the trailing slots are byes: the lone player in a
 * one-sided match is auto-advanced up the bracket so the flow stays playable.
 */
@Injectable()
export class TournamentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new tournament (status `registration`) and, when player ids are
   * provided, seat them as the initial participants.
   */
  async createTournament(data: CreateTournamentInput) {
    const maxPlayers = Math.min(64, Math.max(2, Math.floor(data.maxPlayers ?? 16) || 16));
    const name = (data.name ?? '').trim();
    if (!name) throw new BadRequestException('Tournament name is required');

    const tournament = await this.prisma.tournament.create({
      data: {
        name,
        gameType: data.gameType?.trim() || 'tic-tac-toe',
        maxPlayers,
        status: 'registration',
      },
    });

    if (data.playerIds?.length) {
      await this.registerPlayers(tournament.id, data.playerIds);
    }

    return this.getTournament(tournament.id);
  }

  /** List tournaments, newest first, with participant counts. */
  async listTournaments() {
    return this.prisma.tournament.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { players: true, matches: true } } },
    });
  }

  /** Full tournament view: players + every bracket match, ordered by round. */
  async getTournament(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        players: {
          include: { user: { select: { id: true, username: true, rating: true } } },
          orderBy: { seed: 'asc' },
        },
        matches: { orderBy: [{ round: 'asc' }, { bracketIndex: 'asc' }] },
      },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament "${tournamentId}" not found`);
    }
    return tournament;
  }

  /**
   * Add players to a tournament that is still in `registration`.
   * Throws when the tournament is locked (already seeded) or full.
   */
  async registerPlayers(tournamentId: string, playerIds: string[]) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { _count: { select: { players: true } } },
    });
    if (!tournament) throw new NotFoundException(`Tournament "${tournamentId}" not found`);
    if (tournament.status !== 'registration') {
      throw new BadRequestException(`Tournament is already ${tournament.status}, registration is locked`);
    }

    const uniqueIds = [...new Set(playerIds)];
    if (tournament._count.players + uniqueIds.length > tournament.maxPlayers) {
      throw new BadRequestException(
        `Tournament is limited to ${tournament.maxPlayers} players ` +
          `(currently ${tournament._count.players})`,
      );
    }

    // SQLite has no `skipDuplicates` support, so filter out existing seats first.
    const existing = await this.prisma.tournamentPlayer.findMany({
      where: { tournamentId, userId: { in: uniqueIds } },
      select: { userId: true },
    });
    const existingIds = new Set(existing.map((p) => p.userId));
    const freshIds = uniqueIds.filter((userId) => !existingIds.has(userId));

    if (freshIds.length > 0) {
      await this.prisma.tournamentPlayer.createMany({
        data: freshIds.map((userId) => ({ tournamentId, userId })),
      });
    }

    return this.getTournament(tournamentId);
  }

  /**
   * Shuffle the registered players and build the first-round bracket.
   * Idempotency guard: only allowed while the tournament is in `registration`.
   */
  async seedPlayers(tournamentId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { players: { include: { user: true }, orderBy: { joinedAt: 'asc' } } },
    });
    if (!tournament) throw new NotFoundException(`Tournament "${tournamentId}" not found`);
    if (tournament.status !== 'registration') {
      throw new BadRequestException(`Tournament is already ${tournament.status}`);
    }
    if (tournament.players.length < 2) {
      throw new BadRequestException('At least 2 players are required to seed the bracket');
    }

    // Shuffle participants (Fisher-Yates) — seeding order is random.
    const pool = tournament.players.map((p) => ({ id: p.userId, rating: p.user.rating }));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const n = pool.length;
    const numRounds = Math.ceil(Math.log2(n));
    const rounds: TournamentMatch[][] = [];

    await this.prisma.$transaction(async (tx) => {
      // 1. Create every bracket match (ids unknown until created).
      for (let r = 0; r < numRounds; r++) {
        const count = 1 << (numRounds - 1 - r);
        const round: TournamentMatch[] = [];
        for (let i = 0; i < count; i++) {
          round.push(
            await tx.tournamentMatch.create({
              data: { tournamentId, round: r + 1, bracketIndex: i },
            }),
          );
        }
        rounds.push(round);
      }

      // 2. Wire nextMatch pointers: (r, i) -> (r+1, floor(i/2)).
      const sim: SimMatch[] = [];
      for (let r = 0; r < numRounds; r++) {
        for (let i = 0; i < rounds[r].length; i++) {
          const isFinal = r === numRounds - 1;
          sim.push({
            id: rounds[r][i].id,
            round: r + 1,
            index: i,
            a: null,
            b: null,
            winner: null,
            status: 'pending',
            nextId: isFinal ? null : rounds[r + 1][Math.floor(i / 2)].id,
          });
        }
      }
      const simRound = (r: number) => sim.filter((m) => m.round === r + 1);

      // 3. Seat shuffled players into first-round slots (slot s -> match floor(s/2)).
      for (let s = 0; s < n; s++) {
        const m = simRound(0)[Math.floor(s / 2)];
        if (s % 2 === 0) m.a = pool[s].id;
        else m.b = pool[s].id;
      }

      // 4. Resolve byes round by round.
      for (let r = 0; r < numRounds; r++) {
        for (const m of simRound(r)) {
          if (r === 0) {
            // Directly seated round: 2 players -> real match, 1 -> bye, 0 -> phantom.
            if (m.a && m.b) m.status = 'pending';
            else if (m.a || m.b) {
              m.winner = (m.a ?? m.b)!;
              m.status = 'completed';
            } else m.status = 'phantom';
            continue;
          }
          // Round r >= 2: seats come from the winners of the two feeding matches.
          const prev1 = simRound(r - 1)[m.index * 2];
          const prev2 = simRound(r - 1)[m.index * 2 + 1];
          m.a = prev1.winner ?? null;
          m.b = prev2.winner ?? null;
          const fullyResolved = [prev1, prev2].every((p) => p.status !== 'pending');
          if (fullyResolved) {
            if (m.a && m.b) m.status = 'pending';
            else if (m.a || m.b) {
              m.winner = (m.a ?? m.b)!;
              m.status = 'completed';
            } else m.status = 'phantom';
          } else {
            m.status = 'pending'; // still waiting on a live feeder match
          }
        }
      }

      // 5. Persist the resolved bracket (one update per match).
      for (const m of sim) {
        await tx.tournamentMatch.update({
          where: { id: m.id },
          data: {
            playerAId: m.a,
            playerBId: m.b,
            winnerId: m.winner,
            status: m.status === 'phantom' ? 'pending' : m.status,
            nextMatchId: m.nextId,
            ...(m.winner ? { playedAt: new Date() } : {}),
          },
        });
      }

      // 6. Persist seeding order + bracket description.
      for (let i = 0; i < pool.length; i++) {
        await tx.tournamentPlayer.updateMany({
          where: { tournamentId, userId: pool[i].id },
          data: { seed: i + 1 },
        });
      }

      await tx.tournament.update({
        where: { id: tournamentId },
        data: {
          status: 'seeded',
          bracket: JSON.stringify({
            numRounds,
            rounds: simRoundAll(numRounds, sim).map((round) => ({
              round: round[0].round,
              matches: round.map((m) => ({ matchId: m.id, status: m.status })),
            })),
          }),
        },
      });
    });

    // Read the committed state after the transaction so the response is fresh.
    return this.getTournament(tournamentId);
  }

  /**
   * Record the winner of a completed match and move them into the next bracket
   * node (the `nextMatchId` slot, seat A first then B). Completing the final
   * match crowns the tournament champion.
   */
  async advanceWinner(matchId: string, winnerId: string) {
    const match = await this.prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      include: { tournament: true },
    });
    if (!match) throw new NotFoundException(`Match "${matchId}" not found`);
    const tournamentId = match.tournamentId;
    if (match.status === 'completed') {
      throw new BadRequestException(`Match "${matchId}" is already completed`);
    }
    if (winnerId !== match.playerAId && winnerId !== match.playerBId) {
      throw new BadRequestException('Winner must be one of the two players in this match');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.tournamentMatch.update({
        where: { id: matchId },
        data: { status: 'completed', winnerId, playedAt: new Date() },
      });

      if (match.nextMatchId) {
        const next = await tx.tournamentMatch.findUnique({ where: { id: match.nextMatchId } });
        if (!next) throw new NotFoundException(`Next match "${match.nextMatchId}" not found`);

        let nextA = next.playerAId;
        let nextB = next.playerBId;
        if (nextA !== winnerId && nextB !== winnerId) {
          if (!nextA) nextA = winnerId;
          else if (!nextB) nextB = winnerId;
          else throw new BadRequestException('The next match already has both seats filled');
        }

        await tx.tournamentMatch.update({
          where: { id: next.id },
          data: {
            playerAId: nextA,
            playerBId: nextB,
            // A match becomes playable as soon as both seats are occupied.
            status: nextA && nextB ? 'in_progress' : next.status,
          },
        });
      }

      if (!match.nextMatchId) {
        // Final completed -> tournament over.
        await tx.tournament.update({
          where: { id: tournamentId },
          data: { status: 'completed', winnerId },
        });
      } else {
        const t = await tx.tournament.findUnique({ where: { id: tournamentId } });
        if (t && t.status !== 'in_progress' && t.status !== 'completed') {
          await tx.tournament.update({
            where: { id: tournamentId },
            data: { status: 'in_progress' },
          });
        }
      }
    });

    // Read the committed state after the transaction so the response is fresh.
    return this.getTournament(tournamentId);
  }
}

/** Group flat sim matches into per-round arrays (round asc, index asc). */
function simRoundAll(numRounds: number, sim: SimMatch[]): SimMatch[][] {
  const groups: SimMatch[][] = Array.from({ length: numRounds }, () => []);
  for (const m of sim) groups[m.round - 1].push(m);
  return groups;
}
