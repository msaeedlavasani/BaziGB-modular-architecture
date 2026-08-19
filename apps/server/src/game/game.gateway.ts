import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { DatabaseService } from '../database/database.service';
import { GameEngineService, type BaziGBRoom } from './game-engine.service';

/**
 * GameGateway — لایه انتقال (MOD-007)
 * فقط Socket ↔ Service؛ منطق بازی در GameEngineService است.
 */
@WebSocketGateway({ cors: { origin: true, credentials: true } })
@Injectable()
export class GameGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly engine: GameEngineService,
    private readonly db: DatabaseService,
  ) {}

  handleConnection(client: Socket): void {
    // eslint-disable-next-line no-console
    console.log(`[socket] client connected: ${client.id}`);
  }

  @SubscribeMessage('room:join')
  async join(@ConnectedSocket() client: Socket, @MessageBody() body: { roomId: string }): Promise<void> {
    const room = this.db.getRoom(body.roomId) as BaziGBRoom | null;
    if (!room) {
      client.emit('room:error', { message: 'اتاق یافت نشد' });
      return;
    }
    await client.join(body.roomId);
    client.emit('room:state', { roomId: room.id, state: room.state, turn: room.state?.turn });
  }

  @SubscribeMessage('room:leave')
  async leave(@ConnectedSocket() client: Socket, @MessageBody() body: { roomId: string }): Promise<void> {
    await client.leave(body.roomId);
  }

  @SubscribeMessage('game:move')
  async move(@ConnectedSocket() client: Socket, @MessageBody() body: { roomId: string; move: unknown }): Promise<void> {
    try {
      const room = this.db.getRoom(body.roomId) as BaziGBRoom | null;
      if (!room) {
        client.emit('room:error', { message: 'اتاق یافت نشد' });
        return;
      }
      const updated = this.engine.applyMove(room, body.move);
      this.db.saveRoom(updated);
      this.server.to(body.roomId).emit('room:state', { roomId: room.id, state: updated.state, turn: updated.state?.turn });
    } catch (e) {
      client.emit('room:error', { message: e instanceof Error ? e.message : 'حرکت نامعتبر' });
    }
  }
}
