'use client';
import { io, type Socket } from 'socket.io-client';

/**
 * کلاینت Socket.IO برای اتصال به گیتوی سرور NestJS.
 * آدرس پیش‌فرض در توسعه: http://localhost:3001
 */
const SERVER_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export interface SocketEvents {
  'room:state': (payload: { roomId: string; state: unknown; turn: string }) => void;
  'room:error': (payload: { message: string }) => void;
}

export function onRoomState(handler: SocketEvents['room:state']): () => void {
  const s = getSocket();
  s.on('room:state', handler);
  return () => {
    s.off('room:state', handler);
  };
}

export function onRoomError(handler: SocketEvents['room:error']): () => void {
  const s = getSocket();
  s.on('room:error', handler);
  return () => {
    s.off('room:error', handler);
  };
}
