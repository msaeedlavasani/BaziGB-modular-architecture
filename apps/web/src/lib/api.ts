/**
 * Lightweight API client for the BaziGB server (port 3001).
 *
 * Request interceptor:  attaches the stored JWT as an `Authorization: Bearer`
 *                        header to every outgoing request.
 * Response interceptor: normalizes non-2xx responses (NestJS error bodies)
 *                        into a single `ApiError` with a readable message.
 */

/**
 * API base URL.
 *  - Development: NEXT_PUBLIC_API_URL unset -> http://localhost:3001
 *  - Production:  NEXT_PUBLIC_API_URL="" (same origin) -> requests go to
 *                 `/api/*` and are proxied by the reverse proxy (Caddy/Nginx).
 */
const _apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const API_URL = _apiUrl === '' ? '' : _apiUrl;
const API_PREFIX = API_URL === '' ? '/api' : '';

const TOKEN_STORAGE_KEY = 'bazigb_token';

/* ------------------------------ token helpers ----------------------------- */

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function storeToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

/* --------------------------------- errors --------------------------------- */

interface ErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function extractErrorMessage(status: number, body: ErrorBody | null): string {
  if (!body) return `Request failed with status ${status}`;
  if (Array.isArray(body.message)) {
    return body.message.join('. ');
  }
  if (typeof body.message === 'string' && body.message.length > 0) {
    return body.message;
  }
  return body.error || `Request failed with status ${status}`;
}

/* ------------------------------ request core ------------------------------ */

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Request interceptor: inject the JWT when present.
  const token = getStoredToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${API_PREFIX}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(0, 'Unable to reach the server. Is it running on port 3001?');
  }

  // Response interceptor: normalize non-2xx responses into ApiError.
  if (!response.ok) {
    let body: ErrorBody | null = null;
    try {
      body = (await response.json()) as ErrorBody;
    } catch {
      // Non-JSON error body; fall back to the status code.
    }
    throw new ApiError(response.status, extractErrorMessage(response.status, body));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/* ---------------------------------- api ----------------------------------- */

export const api = {
  get: <T>(path: string): Promise<T> => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, {
      method: 'POST',
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
  patch: <T>(path: string, data?: unknown): Promise<T> =>
    request<T>(path, {
      method: 'PATCH',
      body: data === undefined ? undefined : JSON.stringify(data),
    }),
  delete: <T>(path: string): Promise<T> => request<T>(path, { method: 'DELETE' }),
};

/* -------------------------------- rooms --------------------------------- */

export interface RoomResponse {
  id: string;
  gameId: string;
  status: 'waiting' | 'playing' | 'finished';
  players: { id: string; name: string; color: string; isBot?: boolean }[];
  state: unknown;
}

export async function createRoom(gameId: string, mode: 'bot' | 'pvp' = 'bot', difficulty = 'medium'): Promise<RoomResponse> {
  return api.post<RoomResponse>('/rooms', { gameId, mode, difficulty });
}

export async function getRoom(id: string): Promise<RoomResponse> {
  return api.get<RoomResponse>(`/rooms/${id}`);
}
