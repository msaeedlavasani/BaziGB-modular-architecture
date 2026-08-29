import { GUARDS_METADATA } from '@nestjs/common/constants';
import { describe, expect, it } from 'vitest';
import { LeaderboardController } from '../leaderboard/leaderboard.controller';
import { RoomsController } from '../rooms/room.controller';
import { TournamentsController } from '../tournaments/tournament.controller';
import { PrivateAlphaSurfaceGuard } from './private-alpha-surface.guard';

describe('PrivateAlphaSurfaceGuard', () => {
  it('fails closed with 404 for deferred competitive surfaces', () => {
    const guard = new PrivateAlphaSurfaceGuard();
    expect(() => guard.canActivate({} as never)).toThrow('Not Found');
  });

  it('guards Tournament routes while keeping the leaderboard public', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, TournamentsController)).toContain(PrivateAlphaSurfaceGuard);
    expect(Reflect.getMetadata(GUARDS_METADATA, LeaderboardController)).toBeUndefined();
  });

  it('keeps room discovery public', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, RoomsController.prototype.listRooms);

    expect(guards).toBeUndefined();
  });
});
