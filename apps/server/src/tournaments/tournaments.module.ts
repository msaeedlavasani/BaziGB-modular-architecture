import { Module } from '@nestjs/common';
import { TournamentsController } from './tournaments.controller';

@Module({
  controllers: [TournamentsController],
})
export class TournamentsModule {}
