import { Injectable, NotFoundException } from '@nestjs/common';
import type { AIDifficulty, GameId } from '@bazigb/engine';
import { DatabaseService } from '../database/database.service';
import { GameEngineService, type BaziGBRoom } from '../game/game-engine.service';

@Injectable()
export class RoomsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly engine: GameEngineService,
  ) {}

  createRoom(gameId: GameId, mode: 'bot' | 'pvp' = 'bot', difficulty: AIDifficulty = 'medium') {
    const room = this.engine.createRoom(gameId, mode, difficulty);
    this.db.saveRoom(room);
    return this.engine.serialize(room);
  }

  getRoomRaw(id: string): BaziGBRoom {
    const room = this.db.getRoom(id) as BaziGBRoom | null;
    if (!room) throw new NotFoundException('اتاق یافت نشد');
    return room;
  }

  getRoom(id: string) {
    return this.engine.serialize(this.getRoomRaw(id));
  }

  listRooms() {
    return this.db.listRooms().map((r) => this.engine.serialize(r as BaziGBRoom));
  }

  persist(room: BaziGBRoom) {
    this.db.saveRoom(room);
  }
}
