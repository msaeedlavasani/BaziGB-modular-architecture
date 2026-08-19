import type { GameId } from '@bazigb/engine';

export interface RoomResponse {
  id: string;
  gameId: GameId;
  status: 'waiting' | 'playing' | 'finished';
  players: { id: string; name: string; color: string; isBot?: boolean }[];
  state: unknown;
}

/** ساخت اتاق در سرور NestJS */
export async function createRoom(gameId: GameId, mode: 'bot' | 'pvp' = 'bot', difficulty = 'medium'): Promise<RoomResponse> {
  const res = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameId, mode, difficulty }),
  });
  if (!res.ok) throw new Error(`خطای سرور: ${res.status}`);
  return (await res.json()) as RoomResponse;
}

/** دریافت وضعیت اتاق */
export async function getRoom(id: string): Promise<RoomResponse> {
  const res = await fetch(`/api/rooms/${id}`);
  if (!res.ok) throw new Error(`خطای سرور: ${res.status}`);
  return (await res.json()) as RoomResponse;
}
