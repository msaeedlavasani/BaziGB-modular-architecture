import { Module } from '@nestjs/common';
import { TournamentsController } from './tournament.controller';
import { TournamentService } from './tournament.service';
import { PrivateAlphaSurfaceGuard } from '../common/private-alpha-surface.guard';

@Module({
  controllers: [TournamentsController],
  providers: [TournamentService, PrivateAlphaSurfaceGuard],
})
export class TournamentsModule {}
