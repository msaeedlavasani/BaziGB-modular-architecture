'use client';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Backgammon, getBestMoveSequence, type BackgammonMove } from '@bazigb/game-backgammon';
import { ChessGame, getBestMove as chessAI } from '@bazigb/game-chess';
import { Vegas, getBestMove as vegasAI } from '@bazigb/game-vegas';

import GameShell from '@/components/game/GameShell';
import TicTacToeBoard from '@/components/game/TicTacToeBoard';
import BackgammonBoard from '@/components/game/BackgammonBoard';
import ChessBoard from '@/components/game/ChessBoard';
import ChessInfo from '@/components/game/ChessInfo';
import VegasBoard from '@/components/game/VegasBoard';

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

const GAME_CHIPS: Record<GameId, string> = {
  'tic-tac-toe': '✕ دوز',
  backgammon: '🎲 نرد',
  chess: '♞ شطرنج',
  vegas: '💵 وگاس',
};

function GameInner() {
  const params = useParams<{ gameId: string }>();
  const router = useRouter();
  const gameId = (params.gameId ?? 'tic-tac-toe') as GameId;
  const adapter = ADAPTERS[gameId];

  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [match, setMatch] = useState({ matchPoint: false, winByTwo: false, targetScore: 5 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, setState] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
  }, [adapter, gameId, match, players]);

  useEffect(() => {
    newGame();
  }, [newGame]);

  const myId = 'p1';
  const humanTurn = !!state && state.phase === 'playing' && state.turn === myId;

  // ---- منطق محلی (بازی با ربات) ----
  const applyLocal = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (m: any) => {
      const s = stateRef.current;
      if (!s) return;
      try {
        let next;
        if (Array.isArray(m)) {
          next = adapter.applyChain(s, m);
        } else if (gameId === 'backgammon' && (m.kind === 'roll' || m.kind === 'move')) {
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
    if (!s || s.phase === 'finished' || s.turn !== 'bot') return;
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
  }, [adapter, difficulty, gameId]);

  useEffect(() => {
    if (state && state.phase === 'playing' && state.turn === 'bot') {
      const t = setTimeout(runBot, 500);
      return () => clearTimeout(t);
    }
  }, [state, runBot]);

  const board = (() => {
    if (!state) return null;
    const disabled = !humanTurn;
    switch (gameId) {
      case 'tic-tac-toe':
        return <TicTacToeBoard state={state} onMove={(m) => applyLocal(m)} disabled={disabled} />;
      case 'backgammon':
        return (
          <BackgammonBoard
            state={state}
            onRoll={() => applyLocal({ player: state.turn, kind: 'roll' })}
            onMove={(m: BackgammonMove) => applyLocal(m)}
            onEndTurn={() => applyLocal([])}
            isMyTurn={humanTurn}
            myColor={1}
          />
        );
      case 'chess':
        return <ChessBoard state={state} onMove={(m) => applyLocal(m)} disabled={disabled} />;
      case 'vegas':
        return <VegasBoard state={state} onMove={(m) => applyLocal(m)} disabled={disabled} />;
      default:
        return null;
    }
  })();

  const isFinished = !!state && state.phase === 'finished';
  const winner = isFinished
    ? {
        label: state.winner
          ? state.winner === myId
            ? '🎉 شما برنده شدید!'
            : 'ربات برنده شد'
          : 'مساوی!',
        sub: gameId === 'backgammon' && state.scores
          ? `امتیاز نهایی — شما ${state.scores[myId] ?? 0} : ${state.scores.bot ?? 0} ربات`
          : undefined,
        onRematch: newGame,
      }
    : null;

  const scores =
    state && state.scores && supportsMatchPoint(gameId)
      ? { a: state.scores[myId] ?? 0, b: state.scores.bot ?? 0 }
      : null;

  const settings = (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>سطح ربات</InputLabel>
        <Select
          value={difficulty}
          label="سطح ربات"
          onChange={(e) => setDifficulty(e.target.value as AIDifficulty)}
          sx={{ borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
        >
          <MenuItem value="easy">آسان</MenuItem>
          <MenuItem value="medium">متوسط</MenuItem>
          <MenuItem value="hard">سخت</MenuItem>
        </Select>
      </FormControl>
      {supportsMatchPoint(gameId) && (
        <>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={match.matchPoint}
                onChange={(e) => setMatch({ ...match, matchPoint: e.target.checked })}
              />
            }
            label={<Typography variant="body2">مسابقه</Typography>}
          />
          {match.matchPoint && (
            <>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={match.winByTwo}
                    onChange={(e) => setMatch({ ...match, winByTwo: e.target.checked })}
                  />
                }
                label={<Typography variant="body2">برد با ۲</Typography>}
              />
              <FormControl size="small" sx={{ minWidth: 90 }}>
                <InputLabel>هدف</InputLabel>
                <Select
                  value={match.targetScore}
                  label="هدف"
                  onChange={(e) => setMatch({ ...match, targetScore: Number(e.target.value) })}
                  sx={{ borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
                >
                  {[3, 5, 7, 9].map((n) => (
                    <MenuItem key={n} value={n}>
                      {n} امتیاز
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </>
      )}
      <Button size="small" variant="outlined" color="primary" onClick={newGame}>
        بازی جدید
      </Button>
    </Box>
  );

  return (
    <GameShell
      title={GAME_TITLES[gameId]}
      gameChip={GAME_CHIPS[gameId]}
      onBack={() => router.push('/lobby')}
      turnText={state && state.phase === 'playing' ? (humanTurn ? 'نوبت شما' : 'نوبت ربات') : null}
      scores={scores}
      maxRounds={match.matchPoint ? match.targetScore : 1}
      settings={settings}
      winner={winner}
    >
      {!state ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
          <Chip label="در حال آماده‌سازی بازی…" variant="outlined" />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', minWidth: 0 }}>
          {board}
          {gameId === 'chess' && <ChessInfo state={state} />}
        </Box>
      )}

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </GameShell>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<Typography sx={{ color: 'text.secondary' }}>در حال بارگذاری...</Typography>}>
      <GameInner />
    </Suspense>
  );
}
