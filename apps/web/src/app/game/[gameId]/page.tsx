'use client';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

import {
  DEFAULT_MATCH,
  supportsMatchPoint,
  type AIDifficulty,
  type GameAdapter,
  type GameId,
  type Player,
} from '@bazigb/engine';
import { TicTacToe, getBestMove as tttAI } from '@bazigb/game-tic-tac-toe';
import { Backgammon, getBestMoveSequence, getMoveHints as bgHints } from '@bazigb/game-backgammon';
import { ChessGame, getBestMove as chessAI } from '@bazigb/game-chess';
import { Vegas, getBestMove as vegasAI } from '@bazigb/game-vegas';

import TicTacToeBoard from '@/components/game/TicTacToeBoard';
import BackgammonBoard from '@/components/game/BackgammonBoard';
import ChessBoard from '@/components/game/ChessBoard';
import VegasBoard from '@/components/game/VegasBoard';
import { getSocket, onRoomError, onRoomState } from '@/lib/socket';

const ADAPTERS: Record<GameId, GameAdapter> = {
  'tic-tac-toe': TicTacToe,
  backgammon: Backgammon,
  chess: ChessGame,
  vegas: Vegas,
};

const COLORS: Record<GameId, [Player['color'], Player['color']]> = {
  'tic-tac-toe': ['x', 'o'],
  backgammon: [1, -1],
  chess: ['white', 'black'],
  vegas: ['gold', 'gold'],
};

const AI_FNS: Record<GameId, (state: unknown, d: AIDifficulty) => unknown> = {
  'tic-tac-toe': tttAI as (state: unknown, d: AIDifficulty) => unknown,
  backgammon: getBestMoveSequence as (state: unknown, d: AIDifficulty) => unknown,
  chess: chessAI as (state: unknown, d: AIDifficulty) => unknown,
  vegas: vegasAI as (state: unknown, d: AIDifficulty) => unknown,
};

const GAME_TITLES: Record<GameId, string> = {
  'tic-tac-toe': 'دوز',
  backgammon: 'نرد',
  chess: 'شطرنج',
  vegas: 'وگاس',
};

function GameInner() {
  const params = useParams<{ gameId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameId = (params.gameId ?? 'tic-tac-toe') as GameId;
  const adapter = ADAPTERS[gameId];
  const roomId = searchParams.get('room');
  const isRoom = !!roomId;

  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [match, setMatch] = useState({ matchPoint: false, winByTwo: false, targetScore: 5 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, setState] = useState<any>(null);
  const [hints, setHints] = useState<unknown[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const players = useMemo<Player[]>(
    () => [
      { id: 'p1', name: 'شما', color: COLORS[gameId][0] },
      { id: 'bot', name: 'ربات', color: COLORS[gameId][1], isBot: true },
    ],
    [gameId],
  );

  const newGame = useCallback(() => {
    const config = supportsMatchPoint(gameId) ? match : DEFAULT_MATCH;
    setState(adapter.createState(players, config));
    setHints([]);
  }, [adapter, gameId, match, players]);

  useEffect(() => {
    newGame();
  }, [newGame]);

  const myId = 'p1';
  const humanTurn = !!state && state.phase === 'playing' && state.turn === myId;

  // ---- منطق محلی (بازی با کامپیوتر) ----
  const applyMove = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (m: any) => {
      const s = stateRef.current;
      if (!s) return;
      try {
        let next;
        if (Array.isArray(m)) {
          next = adapter.applyChain(s, m);
        } else if (gameId === 'backgammon' && m.kind === 'roll') {
          next = adapter.applyChain(s, [m]);
        } else {
          next = adapter.applyMove(s, m);
        }
        setState(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'حرکت نامعتبر');
      }
    },
    [adapter, gameId],
  );

  // حرکت ربات (فقط حالت محلی)
  const runBot = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.phase === 'finished' || s.turn !== 'bot' || isRoom) return;
    try {
      let cur = s;
      // نرد: اول تاس
      if (gameId === 'backgammon' && !(cur.dice && cur.dice.length)) {
        cur = adapter.applyChain(cur, [{ player: cur.turn, kind: 'roll' }]);
      }
      const move = AI_FNS[gameId](cur, difficulty);
      let next;
      if (move === null || (Array.isArray(move) && move.length === 0)) {
        // پاس خودکار (نرد)
        next = gameId === 'backgammon' ? adapter.applyChain(cur, []) : cur;
      } else if (Array.isArray(move)) {
        next = adapter.applyChain(cur, move as never);
      } else {
        next = adapter.applyMove(cur, move as never);
      }
      setState(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطای ربات');
    }
  }, [adapter, difficulty, gameId, isRoom]);

  useEffect(() => {
    if (isRoom) return;
    if (state && state.phase === 'playing' && state.turn === 'bot') {
      const t = setTimeout(runBot, 500);
      return () => clearTimeout(t);
    }
  }, [state, isRoom, runBot]);

  // ---- حالت آنلاین (اتاق) ----
  useEffect(() => {
    if (!isRoom) return;
    const socket = getSocket();
    socket.connect();
    const offState = onRoomState(({ state: st }) => setState(st));
    const offError = onRoomError(({ message }) => setError(message));
    socket.emit('room:join', { roomId });
    setConnected(true);
    return () => {
      socket.emit('room:leave', { roomId });
      offState();
      offError();
    };
  }, [isRoom, roomId]);

  // ---- راهنمای حرکت (Hint Dots) برای نرد ----
  useEffect(() => {
    if (gameId !== 'backgammon' || !state || state.phase !== 'playing' || state.turn !== myId) {
      setHints([]);
      return;
    }
    if (state.dice && state.dice.length) {
      setHints((bgHints(state) as unknown[][]).slice(0, 12));
    } else {
      setHints([]);
    }
  }, [gameId, state]);

  const board = (() => {
    if (!state) return null;
    const disabled = !humanTurn;
    switch (gameId) {
      case 'tic-tac-toe':
        return <TicTacToeBoard state={state} onMove={(m) => applyMove(m)} disabled={disabled} />;
      case 'backgammon':
        return <BackgammonBoard board={state.board} bar={state.bar} off={state.off} />;
      case 'chess':
        return <ChessBoard state={state} onMove={(m) => applyMove(m)} disabled={disabled} />;
      case 'vegas':
        return <VegasBoard state={state} onMove={(m) => applyMove(m)} disabled={disabled} />;
      default:
        return null;
    }
  })();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', minWidth: 0 }}>
      {/* نوار تنظیمات */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ color: 'text.primary' }}>
          {GAME_TITLES[gameId]}
        </Typography>
        {isRoom ? (
          <Chip label={`اتاق ${roomId}`} color="primary" size="small" />
        ) : (
          <>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>سطح ربات</InputLabel>
              <Select value={difficulty} label="سطح ربات" onChange={(e) => setDifficulty(e.target.value as AIDifficulty)}>
                <MenuItem value="easy">آسان</MenuItem>
                <MenuItem value="medium">متوسط</MenuItem>
                <MenuItem value="hard">سخت</MenuItem>
              </Select>
            </FormControl>
            {supportsMatchPoint(gameId) && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControlLabel
                  control={<Switch size="small" checked={match.matchPoint} onChange={(e) => setMatch({ ...match, matchPoint: e.target.checked })} />}
                  label={<Typography variant="body2">مسابقه</Typography>}
                />
                {match.matchPoint && (
                  <>
                    <FormControlLabel
                      control={<Switch size="small" checked={match.winByTwo} onChange={(e) => setMatch({ ...match, winByTwo: e.target.checked })} />}
                      label={<Typography variant="body2">برد با ۲</Typography>}
                    />
                    <FormControl size="small" sx={{ minWidth: 90 }}>
                      <InputLabel>هدف</InputLabel>
                      <Select value={match.targetScore} label="هدف" onChange={(e) => setMatch({ ...match, targetScore: Number(e.target.value) })}>
                        {[3, 5, 7, 9].map((n) => (
                          <MenuItem key={n} value={n}>
                            {n} امتیاز
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </>
                )}
              </Box>
            )}
            <Button size="small" variant="outlined" color="primary" onClick={newGame}>
              بازی جدید
            </Button>
          </>
        )}
        <Button size="small" variant="text" color="inherit" onClick={() => router.push('/lobby')}>
          بازگشت
        </Button>
      </Box>

      {/* برد */}
      {board}

      {/* نرد: دکمه تاس و راهنمای حرکت ترکیبی */}
      {gameId === 'backgammon' && state && state.phase === 'playing' && state.turn === myId && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {state.dice && state.dice.length ? (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                تاس: {state.dice.join(' و ')} — یک حرکت ترکیبی انتخاب کنید:
              </Typography>
              {hints.length === 0 ? (
                <Chip label="حرکتی ممکن نیست (پاس)" color="warning" onClick={() => applyMove([])} />
              ) : (
                hints.map((chain, i) => (
                  <Chip
                    key={i}
                    label={chain
                      .map((m) => {
                        const mm = m as { from?: number | string; to?: number | string };
                        return `${mm.from === 'bar' ? 'زندان' : mm.from} ← ${mm.to === 'off' ? 'خارج' : mm.to}`;
                      })
                      .join('، ')}
                    color="primary"
                    variant="outlined"
                    onClick={() => applyMove(chain)}
                  />
                ))
              )}
            </Box>
          ) : (
            <Box>
              <Button variant="contained" color="primary" onClick={() => applyMove({ player: state.turn, kind: 'roll' })}>
                ریختن تاس 🎲
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* وضعیت و برنده */}
      {state && state.phase === 'finished' && (
        <Chip
          label={state.winner ? (state.winner === myId ? '🎉 شما برنده شدید!' : 'ربات برنده شد') : 'مساوی'}
          color="primary"
          sx={{ alignSelf: 'center', fontSize: 16, py: 3 }}
        />
      )}

      {isRoom && !connected && <Chip label="در حال اتصال به سرور..." color="warning" sx={{ alignSelf: 'center' }} />}

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<Typography sx={{ color: 'text.secondary' }}>در حال بارگذاری...</Typography>}>
      <GameInner />
    </Suspense>
  );
}
