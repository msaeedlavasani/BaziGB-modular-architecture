import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TournamentService } from './tournament.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { RegisterPlayersDto } from './dto/register-players.dto';
import { AdvanceWinnerDto } from './dto/advance-winner.dto';

/**
 * Tournament bracket API.
 *
 *   POST /tournaments                    -> create a tournament (registration open)
 *   GET  /tournaments                    -> list tournaments
 *   GET  /tournaments/:id                -> full bracket view (players + matches)
 *   POST /tournaments/:id/register       -> seat players (registration only)
 *   POST /tournaments/:id/seed           -> shuffle players + build first-round bracket
 *   POST /tournaments/:id/matches/:matchId/winner
 *                                        -> record a winner and advance the bracket
 */
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentService: TournamentService) {}

  @Post()
  create(@Body() dto: CreateTournamentDto) {
    return this.tournamentService.createTournament(dto);
  }

  @Get()
  list() {
    return this.tournamentService.listTournaments();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.tournamentService.getTournament(id);
  }

  @Post(':id/register')
  register(@Param('id') id: string, @Body() dto: RegisterPlayersDto) {
    return this.tournamentService.registerPlayers(id, dto.playerIds);
  }

  @Post(':id/seed')
  seed(@Param('id') id: string) {
    return this.tournamentService.seedPlayers(id);
  }

  @Post(':id/matches/:matchId/winner')
  advanceWinner(
    @Param('id') id: string,
    @Param('matchId') matchId: string,
    @Body() dto: AdvanceWinnerDto,
  ) {
    return this.tournamentService.advanceWinner(matchId, dto.winnerId);
  }
}
