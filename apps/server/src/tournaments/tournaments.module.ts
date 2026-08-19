import { Module } from '@nestjs/common';
import { TournamentsController } from './tournament.controller';
import { TournamentService } from './tournament.service';

@Module({
  controllers: [TournamentsController],
  providers: [TournamentService],
})
export class TournamentsModule {}
