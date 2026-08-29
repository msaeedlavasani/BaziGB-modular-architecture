/**
 * Room API client, built on top of the shared client in lib/api.ts.
 *
 *   GET  /rooms            -> list rooms
 *   POST /rooms            -> create a room, returns the room incl. invite code
 *   GET  /rooms/:code      -> fetch a room by invite code (incl. persisted currentState)
 *
 * Seating players happens over the socket.io `joinRoom` event (see lib/socket.ts).
 */

import { api } from './api';

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface GameContext {
  numPlayers: number;
  currentPlayer: string;
  turn: number;
  /** Ordered list of seated player ids. Turn cycles through this list. */
  players: string[];
  /** Current dice values (if applicable). */
  dice?: number[];
}

export interface GameState {
  G: any;
  ctx: GameContext;
}

export interface Room {
  id: string;
  code: string;
  status: RoomStatus;
  gameType: string;
  /** Seated player ids (socket ids until auth is wired in). */
  players: string[];
  currentState: GameState | null;
  winnerId: string | null;
  /** Socket id of the room creator (can issue the START command in Vegas). */
  ownerId: string | null;
  /** Best-of-N match length: 1 = single game, 3 = first to 2, 5 = first to 3. */
  maxRounds: number;
  /** Round wins per player id ({ [playerId]: wins }) for multi-round matches. */
  scores: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

/** List rooms; pass a status to filter (e.g. 'waiting'). */
export async function fetchRooms(status?: RoomStatus, gameType?: string): Promise<Room[]> {
  const rooms = await api.get<Room[]>(`/rooms${status ? `?status=${status}` : ''}`);
  return gameType ? rooms.filter((room) => room.gameType === gameType) : rooms;
}

/** Fetch a single room by its invite code (includes currentState from the DB). */
export function fetchRoom(code: string): Promise<Room> {
  return api.get<Room>(`/rooms/${encodeURIComponent(code)}`);
}

/**
 * Ask the server to persist a new empty room; returns the room with its code.
 * `maxRounds` is the best-of-N match length: 1 = single game (default),
 * 3 = first to 2 round wins, 5 = first to 3 round wins.
 */
export function createRoom(gameType = 'tic-tac-toe', maxRounds = 1): Promise<Room> {
  return api.post<Room>('/rooms', { gameType, maxRounds });
}
