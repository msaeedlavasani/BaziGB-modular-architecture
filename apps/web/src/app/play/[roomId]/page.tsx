'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';

import { connectSocket, socket, rejoinRoom } from '@/lib/socket';
import { fetchRoom } from '@/lib/rooms';

import TicTacToeBoard from '@/components/game/TicTacToeBoard';
import BackgammonBoard from '@/components/game/BackgammonBoard';
import ChessBoard from '@/components/game/ChessBoard';
import VegasBoard from '@/components/game/VegasBoard';
import EmptyState from '@/components/shared/EmptyState';
import { GAME_NAMES, type GameId } from '@bazigb/engine';

/**
 * صفحه بازی چندنفره (Room-based) — بازسازی روی معماری مدولار جدید.
 * پروتکل Socket.IO با سرور جدید: joinRoom → startGame → makeMove →
 * gameState / gameOver / matchScore / turnStarted.
 */
export default function PlayPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const roomCode = (params.roomId ?? '').toUpperCase();

  const [room, setRoom] = useState<{ status: string; players: string[]; gameType: GameId; maxRounds: number } | null>(null);
  const [state, setState] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [messages, setMessages] = useState<{ type: string; message: string; username?: string }[]>([]);
  const [chat, setChat] = useState('');
  const [turnInfo, setTurnInfo] = useState<{ player: string; endsAt: number } | null>(null);
  const [seatKey, setSeatKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const startedRef = useRef(false);

  const myId = socket.id ?? '';
  const humanTurn = !!state && state.phase === 'playing' && state.turn === myId;

  useEffect(() => {
    connectSocket();

    const handlers: Record<string, (payload: any) => void> = {
      gameState: (st) => setState(st),
      roomUpdate: (r) => {
        setRoom({ status: r.status, players: r.players, gameType: r.gameType, maxRounds: r.maxRounds });
        if (r.status === 'playing' && r.currentState) {
          setState(r.currentState);
        }
      },
      matchScore: ({ scores: sc }) => setScores(sc),
      gameOver: ({ winner, scores: sc }) => {
        setScores(sc ?? {});
        setState((prev: any) => (prev ? { ...prev, phase: 'finished', winner } : prev));
      },
      systemMessage: (m) => setMessages((prev) => [...prev.slice(-49), m]),
      turnStarted: ({ player, endsAt }) => setTurnInfo({ player, endsAt }),
      seatKey: ({ seatKey: key }) => {
        setSeatKey(key);
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(`bazigb_seat_${roomCode}`, key);
        }
      },
      error: ({ message }) => setError(message),
    };
    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler as never));

    // پیوستن به اتاق (با seatKey برای بازپسگیری صندلی بعد از رفرش)
    const onConnect = () => {
      setConnected(true);
      rejoinRoom(roomCode);
    };
    socket.on('connect', onConnect);
    if (socket.connected) {
      setConnected(true);
      rejoinRoom(roomCode);
    }

    void fetchRoom(roomCode)
      .then((r) =>
        setRoom({
          status: r.status,
          players: r.players,
          gameType: (['tic-tac-toe', 'backgammon', 'chess', 'vegas'].includes(r.gameType) ? r.gameType : 'tic-tac-toe') as GameId,
          maxRounds: r.maxRounds,
        }),
      )
      .catch(() => undefined);

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler as never));
      socket.off('connect', onConnect);
    };
  }, [roomCode]);

  const startGame = useCallback(() => {
    socket.emit('startGame', { roomCode });
  }, [roomCode]);

  const onMove = useCallback(
    (move: unknown) => {
      socket.emit('makeMove', { roomCode, move });
    },
    [roomCode],
  );

  const sendChat = () => {
    if (!chat.trim()) return;
    socket.emit('chatMessage', { room: roomCode, message: chat.trim() });
    setChat('');
  };

  const gameId = room?.gameType ?? 'tic-tac-toe';
  const isOwner = room?.players[0] === myId;

  const board = (() => {
    if (!state) return null;
    const disabled = !humanTurn;
    switch (gameId) {
      case 'tic-tac-toe':
        return <TicTacToeBoard state={state} onMove={onMove} disabled={disabled} />;
      case 'backgammon':
        return <BackgammonBoard board={state.board} bar={state.bar} off={state.off} />;
      case 'chess':
        return <ChessBoard state={state} onMove={onMove} disabled={disabled} />;
      case 'vegas':
        return <VegasBoard state={state} onMove={onMove} disabled={disabled} />;
      default:
        return null;
    }
  })();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', minWidth: 0 }}>
      {/* نوار اتاق */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ color: 'text.primary' }}>
          {GAME_NAMES[gameId] ?? 'بازی'}
        </Typography>
        <Chip label={`اتاق ${roomCode}`} color="primary" size="small" />
        {!connected && <Chip label="در حال اتصال..." color="warning" size="small" />}
        {turnInfo && state?.phase === 'playing' && (
          <Chip
            label={`⏱ ${Math.max(0, Math.round((turnInfo.endsAt - Date.now()) / 1000))} ثانیه`}
            size="small"
            variant="outlined"
          />
        )}
        <Box sx={{ flex: 1 }} />
        <Button size="small" variant="text" color="inherit" onClick={() => router.push('/lobby')}>
          خروج
        </Button>
      </Box>

      {/* منتظر حریف */}
      {room?.status === 'waiting' && (
        <EmptyState
          icon={<span>🕐</span>}
          title="منتظر حریف..."
          description={`کد اتاق: ${roomCode} — برای دعوت از دوست، کد را بفرستید.`}
        />
      )}

      {/* شروع بازی */}
      {room?.status === 'waiting' && room.players.length >= 2 && isOwner && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" color="primary" onClick={startGame}>
            شروع بازی
          </Button>
          <Button variant="outlined" color="primary" onClick={() => socket.emit('newGame', { roomCode })}>
            شروع مجدد
          </Button>
        </Box>
      )}

      {/* برد */}
      {state && board}

      {/* امتیاز راندها (best-of-N) */}
      {Object.keys(scores).length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {Object.entries(scores).map(([pid, s]) => (
            <Chip key={pid} label={`${pid === myId ? 'شما' : 'حریف'}: ${s} برد راند`} variant="outlined" />
          ))}
        </Box>
      )}

      {/* پایان مسابقه */}
      {state?.phase === 'finished' && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            label={state.winner ? (state.winner === myId ? '🎉 شما برنده شدید!' : 'حریف برنده شد') : 'مساوی'}
            color="primary"
            sx={{ fontSize: 16, py: 3 }}
          />
          <Button size="small" variant="contained" color="primary" onClick={() => socket.emit('newGame', { roomCode })}>
            بازی جدید
          </Button>
        </Box>
      )}

      {/* چت */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxWidth: 480 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="پیام..."
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendChat()}
          />
          <Button variant="outlined" color="primary" onClick={sendChat}>
            ارسال
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 120, overflow: 'auto' }}>
          {messages.map((m, i) => (
            <Typography key={i} variant="caption" sx={{ color: 'text.secondary' }}>
              <b style={{ color: m.type === 'success' ? '#EEAC2F' : '#7FA8D9' }}>{m.username ?? 'سیستم'}:</b>{' '}
              {m.message}
            </Typography>
          ))}
        </Box>
      </Box>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
