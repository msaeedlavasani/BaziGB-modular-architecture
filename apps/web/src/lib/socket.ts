import { io, Socket } from 'socket.io-client';

// NOTE: must use `??` — `||` would treat the empty string (same-origin mode)
// as falsy and fall back to localhost:3001, breaking production.
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';

/**
 * Shared socket.io client for the whole app.
 *
 * Resilience:
 *  - `autoConnect: false` lets pages decide when the socket should exist
 *    (e.g. only when a game page mounts).
 *  - Reconnection is enabled with an exponential backoff and unlimited
 *    attempts, so a dropped connection is retried automatically.
 *  - Pages listen for `connect` / `disconnect` / `connect_error` and call
 *    `rejoinRoom()` to re-emit `joinRoom` — the server re-seats the client
 *    (or re-admits a spectator) and re-sends the persisted game state.
 *
 * Production: set NEXT_PUBLIC_SOCKET_URL="" (or leave unset) to connect to
 * the same origin — the reverse proxy forwards /socket.io/* to the server.
 */
export const socket: Socket = io(SOCKET_URL || undefined, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 800,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
  timeout: 10000,
  // Attach the stored JWT to every connection attempt so the server can bind
  // the socket to the real user identity at the handshake (not just at join).
  // The callback form re-reads localStorage on each (re)connect, so logins
  // and logouts are picked up without recreating the socket.
  auth: (cb) => {
    const token =
      typeof window !== 'undefined' ? window.localStorage.getItem('bazigb_token') : null;
    cb({ token: token ?? undefined });
  },
});

/** Connect the socket (no-op when it is already connected). */
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

/**
 * Join (or re-join) a room. Safe to call on every `connect` event — the
 * server treats a re-join as a no-op for seated players, seats newcomers,
 * admits spectators when the room is full, and replies with the latest
 * persisted game state.
 *
 * When a JWT is stored (logged-in user), it is attached to the join payload so
 * the server can bind the socket to the user id — game results then update the
 * profile stats instead of being recorded against anonymous socket ids.
 */
export const rejoinRoom = (roomCode: string) => {
  if (socket.connected) {
    const token =
      typeof window !== 'undefined' ? window.localStorage.getItem('bazigb_token') : null;
    // Seat ticket issued by the server when this client was seated (see the
    // `seatKey` event). Proves "I held this seat" on reconnect so a spectator
    // cannot steal a disconnected player's place. Lives in sessionStorage so
    // it survives a refresh in the same tab.
    const seatKey =
      typeof window !== 'undefined'
        ? window.sessionStorage.getItem(`bazigb_seat_${roomCode}`)
        : null;
    socket.emit('joinRoom', { roomCode, token: token ?? undefined, seatKey: seatKey ?? undefined });
  }
};
