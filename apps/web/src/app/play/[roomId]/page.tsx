'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { Play, Share2, Users } from 'lucide-react';

import { connectSocket, socket, rejoinRoom } from '@/lib/socket';
import { fetchRoom } from '@/lib/rooms';

import GameShell from '@/components/game/GameShell';
import TicTacToeBoard from '@/components/game/TicTacToeBoard';
import BackgammonBoard from '@/components/game/BackgammonBoard';
import ChessBoard from '@/components/game/ChessBoard';
import ChessInfo from '@/components/game/ChessInfo';
import VegasBoard from '@/components/game/VegasBoard';
import type { BackgammonMove } from '@bazigb/game-backgammon';
import type { GameId } from '@bazigb/engine';

const GAME_TITLES: Record<string, string> = {
  'tic-tac-toe': 'دوز',
  backgammon: 'نرد',
  chess: 'شطرنج',
  vegas: 'وگاس',
};

const GAME_CHIPS: Record<string, string> = {
  'tic-tac-toe': '✕ دوز',
  backgammon: '🎲 نرد',
  chess: '♞ شطرنج',
  vegas: '💵 وگاس',
};

type ChatMessage = { type: string; message: string; username?: string; ts: number };

/**
 * صفحه بازی چندنفره (Room-based) — بازسازی UI قبلی روی معماری مدولار جدید.
 * پروتکل Socket.IO: joinRoom → startGame → makeMove {roomCode, move} /
 * rollDice / gameAction → gameState / matchScore / gameOver / turnStarted.
 */
export default function PlayPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const roomCode = (params.roomId ?? '').toUpperCase();

  const [room, setRoom] = useState<{
    status: string;
    players: string[];
    gameType: GameId;
    maxRounds: number;
  } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, setState] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chat, setChat] = useState('');
  const [turnInfo, setTurnInfo] = useState<{ player: string; endsAt: number } | null>(null);
  const [turnWarned, setTurnWarned] = useState(false);
  const [turnExpired, setTurnExpired] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [spectating, setSpectating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const myId = socket.id ?? '';

  // تیک ثانیه‌ای برای شمارش معکوس نوبت
  useEffect(() => {
    if (!turnInfo) return;
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [turnInfo]);

  useEffect(() => {
    connectSocket();

    const handlers: Record<string, (payload: any) => void> = {
      gameState: (st) => setState(st),
      roomUpdate: (r) => {
        setRoom({
          status: r.status,
          players: r.players,
          gameType: (['tic-tac-toe', 'backgammon', 'chess', 'vegas'].includes(r.gameType)
            ? r.gameType
            : 'tic-tac-toe') as GameId,
          maxRounds: r.maxRounds,
        });
        if (r.status === 'playing' && r.currentState) {
          setState(r.currentState);
        }
      },
      matchScore: ({ scores: sc }) => setScores(sc ?? {}),
      gameOver: ({ winner, scores: sc }) => {
        setScores(sc ?? {});
        setState((prev: any) => (prev ? { ...prev, phase: 'finished', winner } : prev));
      },
      systemMessage: (m) =>
        setMessages((prev) => [
          ...prev.slice(-49),
          { type: m.type, message: m.message, username: m.username, ts: Date.now() },
        ]),
      turnStarted: ({ player, endsAt }) => {
        setTurnInfo({ player, endsAt });
        setTurnWarned(false);
        setTurnExpired(false);
      },
      turnWarning: () => setTurnWarned(true),
      turnTimeout: () => {
        setTurnExpired(true);
        setTurnInfo(null);
        setTimeout(() => setTurnExpired(false), 5000);
      },
      seatKey: ({ seatKey: key }) => {
        if (key && typeof window !== 'undefined') {
          window.sessionStorage.setItem(`bazigb_seat_${roomCode}`, key);
        }
      },
      error: ({ message }) => setError(message),
      spectate: () => setSpectating(true),
    };
    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler as never));

    const onConnect = () => {
      setConnected(true);
      rejoinRoom(roomCode);
    };
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    if (socket.connected) {
      setConnected(true);
      rejoinRoom(roomCode);
    }

    void fetchRoom(roomCode)
      .then((r) =>
        setRoom({
          status: r.status,
          players: r.players,
          gameType: (['tic-tac-toe', 'backgammon', 'chess', 'vegas'].includes(r.gameType)
            ? r.gameType
            : 'tic-tac-toe') as GameId,
          maxRounds: r.maxRounds,
        }),
      )
      .catch(() => undefined);

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler as never));
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [roomCode]);

  // اسکرول خودکار چت
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const startGame = useCallback(() => {
    socket.emit('startGame', { roomCode });
  }, [roomCode]);

  const sendChat = () => {
    if (!chat.trim()) return;
    socket.emit('chatMessage', { room: roomCode, message: chat.trim() });
    setChat('');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const gameId = room?.gameType ?? 'tic-tac-toe';
  const isOwner = room?.players[0] === myId;
  // تماشاچی: اتاق پر است و من جزو بازیکنها نیستم (یا سرور spectate فرستاده)
  const isSpectator =
    spectating || (!!room && room.players.length > 0 && !!myId && !room.players.includes(myId));
  const humanTurn = !!state && state.phase === 'playing' && state.turn === myId && !isSpectator;
  const isFinished = !!state && state.phase === 'finished';

  const turnRemainingSec =
    turnInfo && state?.phase === 'playing' && state.turn === myId
      ? Math.max(0, Math.ceil((turnInfo.endsAt - nowMs) / 1000))
      : null;

  const board = (() => {
    if (!state) return null;
    const disabled = !humanTurn;
    switch (gameId) {
      case 'tic-tac-toe':
        return <TicTacToeBoard state={state} onMove={(m) => socket.emit('makeMove', { roomCode, move: m })} disabled={disabled} />;
      case 'backgammon':
        return (
          <BackgammonBoard
            state={state}
            onRoll={() => socket.emit('rollDice', { roomCode })}
            onMove={(m: BackgammonMove) => socket.emit('makeMove', { roomCode, move: [m] })}
            onEndTurn={() => socket.emit('gameAction', { room: roomCode, moveName: 'endTurn' })}
            isMyTurn={humanTurn}
            myColor={state.players?.[0]?.id === myId ? 1 : -1}
          />
        );
      case 'chess':
        return (
          <ChessBoard
            state={state}
            onMove={(m) => socket.emit('makeMove', { roomCode, move: m })}
            disabled={disabled}
            orientation={state.players?.[0]?.id === myId ? 'w' : 'b'}
          />
        );
      case 'vegas':
        return (
          <VegasBoard
            state={state}
            onMove={(m) => socket.emit('makeMove', { roomCode, move: m })}
            disabled={disabled}
            youId={myId}
          />
        );
      default:
        return null;
    }
  })();

  // اسکوربورد مسابقه در ترتیب نشستن (بازیکن ۰ و ۱)
  const [p0, p1] = state?.players ?? [];
  const scoreA = p0 ? (scores[p0.id] ?? 0) : 0;
  const scoreB = p1 ? (scores[p1.id] ?? 0) : 0;
  const maxRounds = room?.maxRounds ?? 1;

  const winner = isFinished
    ? {
        label: state.winner
          ? state.winner === myId
            ? '🎉 شما برنده شدید!'
            : 'حریف برنده شد'
          : 'مساوی!',
        sub: maxRounds > 1 ? `مسابقه ${scoreA} - ${scoreB}` : undefined,
        onRematch: () => socket.emit('newGame', { roomCode }),
      }
    : null;

  const waiting = room?.status === 'waiting' && !isSpectator;
  const timerLabel = turnExpired
    ? 'نوبت منقضی شد'
    : turnWarned && turnRemainingSec !== null
      ? `${turnRemainingSec}s ⚠️`
      : turnRemainingSec !== null
        ? `${turnRemainingSec}s`
        : null;

  return (
    <GameShell
      title={GAME_TITLES[gameId] ?? 'بازی'}
      gameChip={GAME_CHIPS[gameId]}
      onBack={() => router.push('/lobby')}
      connStatus={connected ? 'connected' : 'reconnecting'}
      roomCode={roomCode}
      onCopyRoom={handleCopy}
      copied={copied}
      turnText={
        isSpectator
          ? 'تماشای زنده'
          : state && state.phase === 'playing'
            ? humanTurn
              ? 'نوبت شما'
              : 'نوبت حریف'
            : null
      }
      timerLabel={timerLabel}
      scores={maxRounds > 1 ? { a: scoreA, b: scoreB } : null}
      maxRounds={maxRounds}
      winner={winner}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', minWidth: 0 }}>
        {/* نشان تماشاچی */}
        {isSpectator && !waiting && (
          <Chip
            label="👁 شما تماشاچی هستید — بازی را زنده میبینید"
            variant="outlined"
            sx={{
              alignSelf: 'center',
              borderRadius: 10,
              borderColor: 'rgba(238,172,47,0.4)',
              bgcolor: 'rgba(238,172,47,0.08)',
              color: 'primary.light',
              fontWeight: 700,
              px: 1,
            }}
          />
        )}

        {/* منتظر حریف */}
        {waiting && (
          <Paper
            elevation={0}
            sx={{
              p: 3.5,
              borderRadius: 4,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.light' }}>
              در انتظار حریف…
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              کد اتاق{' '}
              <Typography component="span" sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'text.primary' }}>
                {roomCode}
              </Typography>{' '}
              را برای دوستتان بفرستید
            </Typography>
            {room && (
              <Chip
                icon={<Users size={15} />}
                label={`${room.players.length}/${room.gameType === 'vegas' ? 5 : 2} بازیکن`}
                variant="outlined"
                sx={{ borderRadius: 10, borderColor: 'divider', bgcolor: 'background.paper' }}
              />
            )}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleCopy}
                startIcon={copied ? undefined : <Share2 size={16} />}
                sx={{
                  borderRadius: 3,
                  borderColor: 'rgba(238,172,47,0.4)',
                  bgcolor: 'rgba(238,172,47,0.08)',
                  color: 'primary.light',
                  px: 2.5,
                  fontWeight: 700,
                }}
              >
                {copied ? 'کپی شد!' : 'کپی کد'}
              </Button>
              {room && room.players.length >= 2 && isOwner && (
                <Button
                  variant="contained"
                  onClick={startGame}
                  startIcon={<Play size={16} />}
                  sx={{ borderRadius: 3, px: 3, fontWeight: 800 }}
                >
                  شروع بازی
                </Button>
              )}
            </Box>
            {room && room.players.length >= 2 && !isOwner && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                صاحب اتاق بازی را شروع میکند…
              </Typography>
            )}
          </Paper>
        )}

        {/* برد */}
        {state && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', minWidth: 0 }}>
            {board}
            {gameId === 'chess' && <ChessInfo state={state} />}
          </Box>
        )}

        {/* چت */}
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 520,
            mx: 'auto',
            borderRadius: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'right' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.08em', color: 'text.secondary' }}>
              گفتگو
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, px: 2, py: 1.5, maxHeight: 180, overflowY: 'auto' }}>
            {messages.length === 0 && (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                هنوز پیامی نیست…
              </Typography>
            )}
            {messages.map((m, i) => (
              <Box key={i} sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', wordBreak: 'break-word' }}>
                  <b style={{ color: m.type === 'success' ? '#EEAC2F' : m.type === 'chat' ? '#7FA8D9' : 'text.secondary' }}>
                    {m.type === 'chat' ? m.username ?? 'مهمان' : m.type === 'success' ? 'سیستم' : m.username ?? 'سیستم'}:
                  </b>{' '}
                  {m.message}
                </Typography>
              </Box>
            ))}
            <div ref={chatEndRef} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, px: 2, pb: 1.5 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="پیام…"
              value={chat}
              onChange={(e) => setChat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendChat()}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'rgba(0,0,0,0.2)' } }}
            />
            <Button variant="outlined" color="primary" onClick={sendChat} sx={{ borderRadius: 2, fontWeight: 700 }}>
              ارسال
            </Button>
          </Box>
        </Paper>
      </Box>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </GameShell>
  );
}
