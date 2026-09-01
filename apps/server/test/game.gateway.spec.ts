import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameGateway } from '../src/game/game.gateway';
import { GameState, Player } from '@bazigb/engine';

describe('GameGateway Unit Tests', () => {
  let gateway: GameGateway;
  let roomService: any;
  let historyService: any;
  let jwtService: any;
  let prisma: any;
  let server: any;

  beforeEach(() => {
    roomService = {
      getRoom: vi.fn(),
      saveState: vi.fn(),
      joinRoom: vi.fn(),
      startGame: vi.fn(),
      finishRoom: vi.fn(),
      saveScores: vi.fn(),
      swapPlayer: vi.fn(),
      removePlayer: vi.fn(),
    };
    historyService = {
      recordGameResult: vi.fn(),
    };
    jwtService = {
      verifyAsync: vi.fn(),
    };
    prisma = {
      user: {
        findUnique: vi.fn(),
      },
    };
    server = {
      sockets: {
        adapter: {
          rooms: new Map(),
        },
      },
      to: vi.fn().mockReturnValue({
        emit: vi.fn(),
      }),
    };

    gateway = new GameGateway(roomService, historyService, jwtService, prisma);
    gateway.server = server;
  });

  it('1. swapPlayerIds: should replace oldId with newId in various state fields', () => {
    const oldId = 'old-socket';
    const newId = 'new-socket';
    
    // Vegas scenario with casino board and player maps
    const state: any = {
      players: [{ id: oldId }, { id: 'p2' }],
      turn: oldId,
      winner: oldId,
      scores: { [oldId]: 10, 'p2': 5 },
      playerCash: { [oldId]: 1000 },
      playerCards: { [oldId]: 5 },
      playerDice: { [oldId]: [1, 2] },
      playerDiceRemaining: { [oldId]: 2 },
      board: [
        { 
          dice: { [oldId]: 1 }, 
          stack: { winnerIndex: oldId, runnerUpIndex: 'p2' } 
        }
      ]
    };

    const next = (gateway as any).swapPlayerIds(state, oldId, newId);

    expect(next.players[0].id).toBe(newId);
    expect(next.turn).toBe(newId);
    expect(next.winner).toBe(newId);
    expect(next.scores[newId]).toBe(10);
    expect(next.scores[oldId]).toBeUndefined();
    expect(next.playerCash[newId]).toBe(1000);
    expect(next.playerCash[oldId]).toBeUndefined();
    expect(next.playerCards[newId]).toBe(5);
    expect(next.playerDice[newId]).toEqual([1, 2]);
    expect(next.playerDiceRemaining[newId]).toBe(2);
    expect(next.board[0].dice[newId]).toBe(1);
    expect(next.board[0].stack.winnerIndex).toBe(newId);
    expect(next.board[0].stack.runnerUpIndex).toBe('p2');
  });

  it('2. matchTarget: should map maxRounds correctly to target scores', () => {
    // maxRounds=5 -> 3
    expect((gateway as any).matchTarget(5)).toBe(3);
    // maxRounds=1 -> 1
    expect((gateway as any).matchTarget(1)).toBe(1);
    // maxRounds=2 -> 1
    expect((gateway as any).matchTarget(2)).toBe(1);
    // maxRounds=3 -> 2
    expect((gateway as any).matchTarget(3)).toBe(2);
  });

  it('3. makePlayers: should assign correct colors for different games', () => {
    const room: any = {
      gameType: 'tic-tac-toe',
      players: ['p1', 'p2']
    };
    
    // Mock socketUsernames
    (gateway as any).socketUsernames.set('p1', 'Alice');
    
    const playersTTT = (gateway as any).makePlayers(room);
    expect(playersTTT[0]).toEqual({ id: 'p1', name: 'Alice', color: 'x' });
    expect(playersTTT[1]).toEqual({ id: 'p2', name: 'بازیکن 2', color: 'o' });

    const roomVegas: any = {
      gameType: 'vegas',
      players: ['v1', 'v2', 'v3', 'v4', 'v5']
    };
    const playersVegas = (gateway as any).makePlayers(roomVegas);
    expect(playersVegas).toHaveLength(5);
    // Vegas colors are ['gold', 'gold'] so all should be gold
    playersVegas.forEach(p => expect(p.color).toBe('gold'));
  });

  it('4. undo (handleUndo): should handle various scenarios correctly', async () => {
    const client: any = { id: 'c1', emit: vi.fn() };
    const roomCode = 'ROOM1';

    // (الف) وقتی پشته خالی است -> error
    await gateway.handleUndo(client, { room: roomCode });
    expect(client.emit).toHaveBeenCalledWith('error', { message: 'حرکتی برای بازگرداندن نیست' });

    // (ب) وقتی actorId با آخرین اقدام یکی نیست -> error
    const oldState: any = { turn: 'c1' };
    (gateway as any).undoStacks.set(roomCode, [{ state: oldState, actorId: 'c2' }]);
    
    vi.clearAllMocks();
    await gateway.handleUndo(client, { room: roomCode });
    expect(client.emit).toHaveBeenCalledWith('error', { message: 'فقط بازیکن آخرین حرکت میتواند آن را برگرداند' });

    // (ج) وقتی درست است -> state بازگردانده می‌شود
    (gateway as any).undoStacks.set(roomCode, [{ state: oldState, actorId: 'c1' }]);
    
    vi.clearAllMocks();
    await gateway.handleUndo(client, { room: roomCode });
    expect(roomService.saveState).toHaveBeenCalledWith(roomCode, oldState);
    expect(server.to).toHaveBeenCalledWith(roomCode);
    expect(server.to().emit).toHaveBeenCalledWith('gameState', oldState);
    expect((gateway as any).undoStacks.get(roomCode)).toHaveLength(0);
  });

  it('5. expireTurn: should not perform any action if state mismatch (race guard)', async () => {
    const roomCode = 'ROOM1';
    const oldState: GameState = { turn: 'p1', phase: 'playing' } as any;
    const newState: GameState = { turn: 'p2', phase: 'playing' } as any;

    roomService.getRoom.mockResolvedValue({
      code: roomCode,
      status: 'playing',
      currentState: newState
    });

    vi.clearAllMocks();
    await (gateway as any).expireTurn(roomCode, oldState);
    
    // Should return early and not emit turnTimeout
    expect(server.to).not.toHaveBeenCalled();
    expect(roomService.saveState).not.toHaveBeenCalled();
  });

  it('6. Tic-Tac-Toe Win-by-2 Rule', async () => {
    // (الف) سناریوی عدم برنده (3-2 با هدف 3)
    const room1: any = {
      code: 'ROOM1',
      gameType: 'tic-tac-toe',
      players: ['p1', 'p2'],
      scores: { p1: 2, p2: 2 },
      maxRounds: 5,
      status: 'playing',
    };
    const finalState1: any = { winner: 'p1' };

    roomService.getRoom.mockResolvedValue(room1);
    vi.spyOn(gateway as any, 'initialState').mockReturnValue({});

    await (gateway as any).handleRoundOver(room1, finalState1);

    // p1 = 2+1 = 3. scores = {p1:3, p2:2}. lead = 1 < 2.
    // matchWinner must be null.
    expect(roomService.finishRoom).not.toHaveBeenCalled();
    expect(roomService.startGame).toHaveBeenCalledWith(room1.code, expect.anything());

    // (ب) سناریوی برنده (3-1 با هدف 3)
    vi.clearAllMocks();
    const room2: any = {
      code: 'ROOM2',
      gameType: 'tic-tac-toe',
      players: ['p1', 'p2'],
      scores: { p1: 2, p2: 1 },
      maxRounds: 5,
      status: 'playing',
    };
    const finalState2: any = { winner: 'p1' };

    roomService.getRoom.mockResolvedValue(room2);

    await (gateway as any).handleRoundOver(room2, finalState2);

    // p1 = 2+1 = 3. scores = {p1:3, p2:1}. lead = 2.
    // matchWinner must be 'p1'.
    expect(roomService.finishRoom).toHaveBeenCalledWith(room2.code, 'p1', finalState2);
  });

  it('7. Backgammon uses room points as the match target, not best-of conversion', () => {
    const room: any = { gameType: 'backgammon', players: ['p1', 'p2'], maxRounds: 7 };
    const state = (gateway as any).initialState(room);
    expect(state.match).toEqual({ matchPoint: true, winByTwo: false, targetScore: 7 });
  });

  it('8. Backgammon roundEnd is persisted as an acknowledgement boundary', async () => {
    const room: any = {
      code: 'BGROOM',
      gameType: 'backgammon',
      players: ['p1', 'p2'],
      scores: { p1: 0, p2: 0 },
      maxRounds: 5,
      status: 'playing',
    };
    const state: any = {
      phase: 'roundEnd',
      winner: null,
      gameWinner: 'p1',
      gamePoints: 2,
      scores: { p1: 2, p2: 0 },
    };
    (gateway as any).undoStacks.set(room.code, [{ state: {}, actorId: 'p1' }]);

    await (gateway as any).handleRoundOver(room, state);

    expect(roomService.saveScores).toHaveBeenCalledWith(room.code, state.scores);
    expect(roomService.startGame).not.toHaveBeenCalled();
    expect(roomService.finishRoom).not.toHaveBeenCalled();
    expect((gateway as any).undoStacks.has(room.code)).toBe(false);
    expect(server.to().emit).toHaveBeenCalledWith('roundOver', expect.objectContaining({
      winner: 'p1',
      points: 2,
    }));
  });

  it('9. keeps an active Tic-tac-toe seat during a temporary disconnect and announces reconnecting presence', async () => {
    vi.useFakeTimers();
    const room: any = {
      code: 'TTT01',
      gameType: 'tic-tac-toe',
      status: 'playing',
      players: ['p1', 'p2'],
      ownerId: 'p1',
      currentState: { phase: 'playing', turn: 'p1' },
      scores: {},
    };
    roomService.getRoom.mockResolvedValue(room);
    (gateway as any).socketRooms.set('p1', new Set([room.code]));
    const client: any = { id: 'p1', rooms: new Set([room.code]) };

    await (gateway as any).handleDisconnectInternal(client);

    expect(roomService.removePlayer).not.toHaveBeenCalled();
    expect(server.to().emit).toHaveBeenCalledWith('sessionNotice', expect.objectContaining({
      kind: 'player-reconnecting',
      participantId: 'p1',
    }));
    expect(server.to().emit).toHaveBeenCalledWith('presenceUpdate', expect.objectContaining({
      participants: expect.arrayContaining([
        expect.objectContaining({ id: 'p1', connection: 'reconnecting' }),
      ]),
    }));
    (gateway as any).clearReconnectTimer(room.code, 'p1');
    vi.useRealTimers();
  });

  it('10. explicit Tic-tac-toe leave ends the game and tells the remaining room', async () => {
    const room: any = {
      code: 'TTT02',
      gameType: 'tic-tac-toe',
      status: 'playing',
      players: ['p1', 'p2'],
      ownerId: 'p1',
      currentState: { phase: 'playing', turn: 'p1' },
      scores: {},
    };
    roomService.getRoom.mockResolvedValue(room);
    roomService.finishRoom.mockResolvedValue({ ...room, status: 'finished' });
    const client: any = { id: 'p1', emit: vi.fn(), leave: vi.fn() };

    await gateway.handleLeaveRoom(client, { roomCode: room.code });

    expect(roomService.finishRoom).toHaveBeenCalledWith(
      room.code,
      'p2',
      expect.objectContaining({ phase: 'finished', winner: 'p2' }),
    );
    expect(server.to().emit).toHaveBeenCalledWith('sessionNotice', expect.objectContaining({
      kind: 'game-ended-by-creator',
    }));
    expect(client.leave).toHaveBeenCalledWith(room.code);
  });

  it('11. attributes a quick reaction to a participant in the room', () => {
    (gateway as any).socketRooms.set('p1', new Set(['ROOM1']));
    (gateway as any).socketUsernames.set('p1', 'Alice');
    const client: any = { id: 'p1' };

    gateway.handleReaction(client, { room: 'ROOM1', reaction: '👏' });

    expect(server.to).toHaveBeenCalledWith('ROOM1');
    expect(server.to().emit).toHaveBeenCalledWith('reaction', expect.objectContaining({
      participantId: 'p1',
      username: 'Alice',
      reaction: '👏',
    }));
  });

  it('12. ignores chat sent by a socket that is not a member of the room', async () => {
    const client: any = { id: 'outsider' };

    await gateway.handleChatMessage(client, { room: 'ROOM1', message: 'hello' });

    expect(server.to).not.toHaveBeenCalled();
  });

  it('13. requires both seated Tic-tac-toe players to accept a rematch', async () => {
    const room: any = {
      code: 'TTT03',
      gameType: 'tic-tac-toe',
      status: 'finished',
      players: ['p1', 'p2'],
      ownerId: 'p1',
      currentState: { phase: 'finished', winner: 'p1' },
      scores: { p1: 1, p2: 0 },
      maxRounds: 1,
    };
    roomService.getRoom.mockResolvedValue(room);
    roomService.startGame.mockResolvedValue({ ...room, status: 'playing' });
    vi.spyOn(gateway as any, 'initialState').mockReturnValue({ phase: 'playing', turn: 'p1' });
    (gateway as any).socketRooms.set('p1', new Set([room.code]));
    (gateway as any).socketRooms.set('p2', new Set([room.code]));
    const player1: any = { id: 'p1', emit: vi.fn() };
    const player2: any = { id: 'p2', emit: vi.fn() };

    await gateway.handleNewGame(player1, { roomCode: room.code });

    expect(roomService.startGame).not.toHaveBeenCalled();
    expect(server.to().emit).toHaveBeenCalledWith('rematchUpdate', expect.objectContaining({
      voterIds: ['p1'],
      required: 2,
      status: 'waiting',
    }));

    await gateway.handleNewGame(player2, { roomCode: room.code });

    expect(roomService.startGame).toHaveBeenCalledWith(
      room.code,
      expect.objectContaining({ phase: 'playing' }),
      { resetScores: true },
    );
    expect(server.to().emit).toHaveBeenCalledWith('rematchUpdate', expect.objectContaining({
      voterIds: ['p1', 'p2'],
      status: 'accepted',
    }));
  });

  it('14. rejects a spectator rematch request', async () => {
    const room: any = {
      code: 'TTT04',
      gameType: 'tic-tac-toe',
      status: 'finished',
      players: ['p1', 'p2'],
      currentState: { phase: 'finished' },
    };
    roomService.getRoom.mockResolvedValue(room);
    (gateway as any).socketRooms.set('viewer', new Set([room.code]));
    const client: any = { id: 'viewer', emit: vi.fn() };

    await gateway.handleNewGame(client, { roomCode: room.code });

    expect(roomService.startGame).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'فقط بازیکنان این اتاق می‌توانند درخواست بازی دوباره بدهند',
    });
  });

  it('15. lets the creator start a full Backgammon room', async () => {
    const room: any = {
      code: 'BGSTART',
      gameType: 'backgammon',
      status: 'waiting',
      players: ['p1', 'p2'],
      ownerId: 'p1',
      currentState: null,
      scores: {},
      maxRounds: 1,
    };
    roomService.getRoom.mockResolvedValue(room);
    roomService.startGame.mockResolvedValue({ ...room, status: 'playing' });
    const client: any = { id: 'p1', emit: vi.fn() };

    await gateway.handleStartGame(client, { roomCode: room.code });

    expect(roomService.startGame).toHaveBeenCalledWith(
      room.code,
      expect.objectContaining({ phase: 'playing' }),
      { resetScores: true },
    );
    expect(server.to().emit).toHaveBeenCalledWith('sessionNotice', { kind: 'game-started' });
    expect(client.emit).not.toHaveBeenCalledWith('error', expect.anything());
  });
});
