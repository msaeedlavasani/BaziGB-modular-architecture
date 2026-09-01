'use client';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
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
import { Undo2 } from 'lucide-react';
import { TicTacToe, getBestMove as tttAI } from '@bazigb/game-tic-tac-toe';
import * as BG from '@bazigb/game-backgammon';
import { BACKGAMMON_RULES_PROFILE, Backgammon, getBestMoveSequence, type BackgammonMove } from '@bazigb/game-backgammon';
import { ChessGame, getBestMove as chessAI } from '@bazigb/game-chess';
import { Vegas, getBestMove as vegasAI } from '@bazigb/game-vegas';

import GameShell from '@/components/game/GameShell';
import GameSettingsToolbar from '@/components/game/GameSettingsToolbar';
import Modal from '@/components/shared/Modal';
import TicTacToeBoard from '@/components/game/TicTacToeBoard';
import BackgammonBoard from '@/components/game/BackgammonBoard';
import ChessBoard from '@/components/game/ChessBoard';
import ChessInfo from '@/components/game/ChessInfo';
import VegasBoard from '@/components/game/VegasBoard';
import { useAppLocale } from '@/hooks/useAppLocale';
import { getMessages } from '@/i18n/messages';
import { canRetainLocalUndoHistory } from '@/lib/local-game-undo';
import {
  addLocalBackgammonMove,
  autoDraftForcedBearOff,
  canCommitLocalBackgammonTurn,
  commitLocalBackgammonTurnTransaction,
  getLocalBackgammonNextMoves,
  restoreLocalBackgammonTurn,
  startLocalBackgammonTurn,
  undoLocalBackgammonMove,
  type LocalBackgammonTurn,
} from '@/lib/local-backgammon-turn';
import { getGameShellMessages } from '@/i18n/game-shell';
import { localizedGameHubRoute } from '@/i18n/routing';
import { api } from '@/lib/api';
import { getGameCatalogEntry, getGameTitle, isWebGameId } from '@/lib/game-catalog';
import { soundService } from '@/lib/sound-service';

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

function GameInner() {
  const params = useParams<{ gameId: string }>();
  const locale = useAppLocale();
  const messages = getMessages(locale);
  const shellMessages = getGameShellMessages(locale);
  const rawGameId = params.gameId ?? 'tic-tac-toe';
  const gameId: GameId = isWebGameId(rawGameId) ? rawGameId : 'tic-tac-toe';
  const adapter = ADAPTERS[gameId];

  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [draftDifficulty, setDraftDifficulty] = useState<AIDifficulty>('medium');
  const [match, setMatch] = useState(() => {
    if (gameId === 'tic-tac-toe') return { matchPoint: true, winByTwo: true, targetScore: 5 };
    return { matchPoint: false, winByTwo: false, targetScore: 5 };
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [state, setState] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [soundPromptOpen, setSoundPromptOpen] = useState(false);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [backgammonTurn, setBackgammonTurn] = useState<LocalBackgammonTurn | null>(null);
  const hydratedGameRef = useRef<string | null>(null);
  const previousTicTacToeStateRef = useRef<{ turn: string; phase: string; markCount: number } | null>(null);

  const stateRef = useRef(state);
  const backgammonTurnRef = useRef(backgammonTurn);
  const isBotRunning = useRef(false);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    backgammonTurnRef.current = backgammonTurn;
  }, [backgammonTurn]);

  useEffect(() => {
    if (!soundService.hasSoundChoice()) setSoundPromptOpen(true);
  }, []);

  const completeSoundChoice = (enabled: boolean) => {
    soundService.chooseSound(enabled);
    setSoundPromptOpen(false);
    if (enabled) soundService.play('game-start');
  };

  const players = useMemo<Player[]>(
    () => [
      { id: 'p1', name: messages.gameShell.you, color: COLORS[gameId][0] },
      { id: 'p2', name: messages.gameShell.bot, color: COLORS[gameId][1], isBot: true },
    ],
    [gameId, messages.gameShell.bot, messages.gameShell.you],
  );

  const newGame = useCallback(() => {
    const config = supportsMatchPoint(gameId) ? match : DEFAULT_MATCH;
    setDifficulty(draftDifficulty);
    setUndoStack([]);
    setBackgammonTurn(null);
    setState(adapter.createState(players, config));
    soundService.play('game-start');
  }, [adapter, draftDifficulty, gameId, match, players]);

  useEffect(() => {
    if (hydratedGameRef.current !== gameId) {
      hydratedGameRef.current = gameId;
      try {
        const stored = window.sessionStorage.getItem(`bazigb_local_game_${gameId}`);
        if (stored) {
          const restored = JSON.parse(stored);
          if (restored?.gameId === gameId && Array.isArray(restored?.players) && restored?.board !== undefined) {
            setUndoStack([]);
            if (gameId === 'backgammon') {
              const storedTurn = window.sessionStorage.getItem('bazigb_local_turn_backgammon');
              const restoredTurn = restoreLocalBackgammonTurn(storedTurn ? JSON.parse(storedTurn) : null);
              setBackgammonTurn(restoredTurn);
              setState(restoredTurn ? BG.applyTurnDraft(restoredTurn.baseState, restoredTurn.moves) : restored);
            } else {
              setState(restored);
            }
            return;
          }
        }
      } catch {
        window.sessionStorage.removeItem(`bazigb_local_game_${gameId}`);
      }
      newGame();
    }
  }, [gameId, newGame]);

  useEffect(() => {
    if (gameId !== 'tic-tac-toe' || !state) {
      previousTicTacToeStateRef.current = null;
      return;
    }

    const markCount = state.board.filter(Boolean).length;
    const previous = previousTicTacToeStateRef.current;
    previousTicTacToeStateRef.current = { turn: state.turn, phase: state.phase, markCount };
    if (!previous) return;

    if (previous.phase !== 'finished' && state.phase === 'finished') {
      const cue = state.winner === myId ? 'win' : state.winner ? 'loss' : 'draw';
      const timer = window.setTimeout(() => soundService.play(cue), 120);
      return () => window.clearTimeout(timer);
    }

    if (
      previous.turn !== state.turn
      && state.turn === myId
      && state.phase === 'playing'
      && markCount === previous.markCount
    ) {
      const timer = window.setTimeout(() => soundService.play('your-turn'), 120);
      return () => window.clearTimeout(timer);
    }
  }, [gameId, state]);

  useEffect(() => {
    if (!state || hydratedGameRef.current !== gameId) return;
    window.sessionStorage.setItem(`bazigb_local_game_${gameId}`, JSON.stringify(state));
  }, [gameId, state]);

  useEffect(() => {
    if (gameId !== 'backgammon' || hydratedGameRef.current !== gameId) return;
    if (backgammonTurn) {
      window.sessionStorage.setItem('bazigb_local_turn_backgammon', JSON.stringify(backgammonTurn));
    } else {
      window.sessionStorage.removeItem('bazigb_local_turn_backgammon');
    }
  }, [backgammonTurn, gameId]);

  // Reconcile forced bear-off moves from the transaction lifecycle, not only
  // click handlers. This covers refresh, session restoration and HMR without
  // auto-playing any ambiguous or non-bearing move.
  useEffect(() => {
    if (gameId !== 'backgammon' || !backgammonTurn) return;
    const auto = autoDraftForcedBearOff(backgammonTurn);
    if (auto.applied.length === 0) return;
    if (auto.state.off[1] === 15 && canCommitLocalBackgammonTurn(auto.transaction)) {
      const committed = commitLocalBackgammonTurnTransaction(auto.transaction);
      setBackgammonTurn(null);
      setUndoStack([]);
      setState(committed);
      return;
    }
    setBackgammonTurn(auto.transaction);
    setState(auto.state);
  }, [backgammonTurn, gameId]);

  const myId = 'p1';
  const humanTurn = !!state && state.phase === 'playing' && state.turn === myId;

  useEffect(() => {
    if (!canRetainLocalUndoHistory(state, myId)) setUndoStack([]);
  }, [state?.phase, state?.turn]);

  const applyLocal = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (m: any) => {
      const s = stateRef.current;
      if (!s) return;
      try {
        if (gameId === 'backgammon') {
          const actions = Array.isArray(m) ? m : [m];
          if (actions.length === 1 && actions[0]?.kind === 'roll') {
            const rolled = BG.applyMove(s, actions[0]);
            setBackgammonTurn(startLocalBackgammonTurn(rolled));
            setState(rolled);
            return;
          }
          const transaction = backgammonTurnRef.current ?? startLocalBackgammonTurn(s);
          const drafted = addLocalBackgammonMove(transaction, actions);
          setBackgammonTurn(drafted.transaction);
          setState(drafted.state);
          return;
        }
        const actions = Array.isArray(m) ? m : [m];
        const undoable = actions.some((action) => adapter.canUndoMove ? adapter.canUndoMove(s, action) : true);
        if (undoable) {
          setUndoStack((prev) => {
            const next = [...prev, s];
            return next.length > 10 ? next.slice(next.length - 10) : next;
          });
        }
        let next;
        if (Array.isArray(m)) {
          next = adapter.applyChain(s, m);
        } else {
          next = adapter.applyMove(s, m);
        }
        if (next.phase === 'roundEnd' || next.phase === 'finished') setUndoStack([]);
        setState(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : messages.gameShell.invalidMove);
      }
    },
    [adapter, gameId, messages.gameShell.invalidMove],
  );

  const handleUndo = useCallback(() => {
    if (gameId === 'backgammon') {
      const transaction = backgammonTurnRef.current;
      if (!transaction || transaction.moves.length === 0) return;
      try {
        const undone = undoLocalBackgammonMove(transaction);
        setBackgammonTurn(undone.transaction);
        setState(undone.state);
      } catch (e) {
        setError(e instanceof Error ? e.message : messages.gameShell.invalidMove);
      }
      return;
    }
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const snapshot = prev[prev.length - 1];
      setState(snapshot);
      return prev.slice(0, -1);
    });
  }, [gameId, messages.gameShell.invalidMove]);

  const commitLocalBackgammonTurn = useCallback(() => {
    const transaction = backgammonTurnRef.current;
    if (!transaction || !canCommitLocalBackgammonTurn(transaction)) return;
    try {
      const committed = commitLocalBackgammonTurnTransaction(transaction);
      setBackgammonTurn(null);
      setUndoStack([]);
      setState(committed);
    } catch (e) {
      setError(e instanceof Error ? e.message : messages.gameShell.invalidMove);
    }
  }, [messages.gameShell.invalidMove]);

  const runBot = useCallback(async () => {
    if (isBotRunning.current) return;
    const s = stateRef.current;
    if (!s || s.phase !== 'playing' || s.turn !== 'p2') return;
    isBotRunning.current = true;
    try {
      const cur = s;
      if (gameId === 'vegas') {
        if (!cur.rolled) {
          setState(adapter.applyMove(cur, { player: 'p2', kind: 'roll' }));
          isBotRunning.current = false;
          return;
        }
        const value = AI_FNS[gameId](cur, difficulty) as number | null;
        if (value == null) {
          isBotRunning.current = false;
          return;
        }
        setState(adapter.applyMove(cur, { player: 'p2', kind: 'place', value }));
        isBotRunning.current = false;
        return;
      }
      if (gameId === 'backgammon') {
        if (!cur.rolled) {
          const next = adapter.applyChain(cur, [{ player: 'p2', kind: 'roll' }]);
          setState(next);
          isBotRunning.current = false;
          return;
        }
        const move = AI_FNS[gameId](cur, difficulty);
        if (move === null || (Array.isArray(move) && move.length === 0)) {
          setState(adapter.applyChain(cur, []));
        } else if (Array.isArray(move)) {
          const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
          let tempState = cur;
          for (const m of move) {
            await sleep(800);
            tempState = adapter.applyChain(tempState, [m]);
            setState(tempState);
            if (tempState.phase !== 'playing') break;
          }
        }
        isBotRunning.current = false;
        return;
      }

      const move = AI_FNS[gameId](cur, difficulty);
      let next;
      if (move === null || (Array.isArray(move) && move.length === 0)) {
        next = cur;
      } else if (Array.isArray(move)) {
        next = adapter.applyChain(cur, move as never);
      } else {
        next = adapter.applyMove(cur, move as never);
      }
      setState(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : messages.gameShell.botError);
    } finally {
      isBotRunning.current = false;
    }
  }, [adapter, difficulty, gameId, messages.gameShell.botError]);

  useEffect(() => {
    if (state && state.phase === 'playing' && state.turn === 'p2') {
      const delay = gameId === 'backgammon' && !state.rolled ? 900 : 800;
      const t = setTimeout(runBot, delay);
      return () => clearTimeout(t);
    }
  }, [state, runBot, gameId]);

  useEffect(() => {
    if (state && state.phase === 'playing' && state.doubling && state.doubling.offeredBy === 'p1') {
      const t = setTimeout(() => {
        const s = stateRef.current;
        if (!s || !s.doubling) return;
        const off = s.off ?? {};
        const accept = (off[-1] ?? 0) >= ((off[1] ?? 0) - 3);
        const fn = (BG as any).respondDouble;
        if (fn) {
          setState(fn(s, 'p2', accept));
        }
      }, 900);
      return () => clearTimeout(t);
    }
  }, [state]);

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
            onChain={(chain) => applyLocal(chain)}
            onEndTurn={commitLocalBackgammonTurn}
            canEndTurn={canCommitLocalBackgammonTurn(backgammonTurn)}
            legalMovesOverride={getLocalBackgammonNextMoves(backgammonTurn)}
            onOfferDouble={() => {
              const fn = (BG as any).offerDouble;
              if (fn) setState(fn(stateRef.current, 'p1'));
            }}
            onRespondDouble={(accept) => {
              const fn = (BG as any).respondDouble;
              if (fn) setState(fn(stateRef.current, 'p1', accept));
            }}
            isMyTurn={humanTurn}
            myColor={1}
          />
        );
      case 'chess':
        return <ChessBoard state={state} onMove={(m) => applyLocal(m)} disabled={disabled} />;
      case 'vegas':
        return <VegasBoard state={state} onMove={(m) => applyLocal(m)} disabled={disabled} youId="p1" />;
      default:
        return null;
    }
  })();

  const isFinished = !!state && state.phase === 'finished';
  const isRoundEnd = gameId === 'backgammon' && state?.phase === 'roundEnd';

  const startNextBackgammonGame = useCallback(() => {
    const current = stateRef.current;
    if (!current || current.phase !== 'roundEnd') return;
    setUndoStack([]);
    setBackgammonTurn(null);
    if (!adapter.startNextGame) return;
    setState(adapter.startNextGame(current));
  }, [adapter]);
  useEffect(() => {
    if (isFinished && state && state.winner) {
      const winnerId = state.winner === 'p1' ? 'p1' : 'p2';
      api.post('/game/bot-result', {
        gameId,
        winner: winnerId,
        state,
      }).catch(() => { /* skip errors for local tracking */ });
    }
  }, [isFinished, state, gameId]);

  const winner = isRoundEnd
    ? {
        label: state.gameWinner === myId ? shellMessages.youWonGame : shellMessages.botWonGame,
        sub: messages.gameShell.finalScore(state.scores[myId] ?? 0, state.scores.p2 ?? 0),
        onRematch: startNextBackgammonGame,
        actionLabel: shellMessages.nextGame,
      }
    : isFinished
    ? {
        label: state.winner
          ? state.winner === myId
            ? messages.gameShell.youWon
            : messages.gameShell.botWon
          : messages.gameShell.draw,
        sub: gameId === 'backgammon' && state.scores
          ? messages.gameShell.finalScore(state.scores[myId] ?? 0, state.scores.p2 ?? 0)
          : undefined,
        onRematch: newGame,
      }
    : null;

  const scores =
    state && state.scores && supportsMatchPoint(gameId)
      ? { a: state.scores[myId] ?? 0, b: state.scores.p2 ?? 0 }
      : null;

  const settings = (
    <GameSettingsToolbar
      options={<>
      <FormControl size="small">
        <InputLabel>{messages.gameShell.difficulty}</InputLabel>
        <Select
          value={draftDifficulty}
          label={messages.gameShell.difficulty}
          onChange={(e) => setDraftDifficulty(e.target.value as AIDifficulty)}
          sx={{ borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
        >
          <MenuItem value="easy">{messages.gameShell.easy}</MenuItem>
          <MenuItem value="medium">{messages.gameShell.medium}</MenuItem>
          <MenuItem value="hard">{messages.gameShell.hard}</MenuItem>
        </Select>
      </FormControl>
      {supportsMatchPoint(gameId) && (
        <>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={match.matchPoint}
                onChange={(e) => {
                  const matchPoint = e.target.checked;
                  const winByTwo = gameId === 'tic-tac-toe' ? true : match.winByTwo;
                  setMatch({ ...match, matchPoint, winByTwo });
                }}
              />
            }
            label={<Typography variant="body2">{messages.gameShell.match}</Typography>}
          />
          {match.matchPoint && (
            <>
              <FormControl size="small">
                <InputLabel>{messages.gameShell.target}</InputLabel>
                <Select
                  value={match.targetScore}
                  label={messages.gameShell.target}
                  onChange={(e) => setMatch({ ...match, targetScore: Number(e.target.value) })}
                  sx={{ borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
                >
                  {(gameId === 'backgammon' ? BACKGAMMON_RULES_PROFILE.targetScores : [3, 5, 7, 9]).map((n) => (
                    <MenuItem key={n} value={n}>
                      {n} {messages.gameShell.points}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </>
      )}
      </>}
      actions={<>
      <Button
        size="small"
        variant="outlined"
        color="primary"
        onClick={handleUndo}
        disabled={(gameId === 'backgammon' ? (backgammonTurn?.moves.length ?? 0) === 0 : undoStack.length === 0) || !humanTurn}
        startIcon={<Undo2 size={14} />}
        title={messages.gameShell.undoLastMove}
      >
        {messages.gameShell.undo}
      </Button>
      <Button size="small" variant="outlined" color="primary" onClick={newGame}>
        {state && (draftDifficulty !== difficulty || state.match.matchPoint !== match.matchPoint || state.match.targetScore !== match.targetScore)
          ? messages.common.startWithSettings
          : messages.common.newGame}
      </Button>
      </>}
    />
  );

  return (
    <GameShell
      title={getGameTitle(gameId, locale)}
      surfaceRatio={getGameCatalogEntry(gameId).surfaceRatio}
      backHref={localizedGameHubRoute(locale, gameId)}
      backLabel={locale === 'fa' ? `بازگشت به صفحهٔ ${getGameTitle(gameId, locale)}` : `Back to ${getGameTitle(gameId, locale)}`}
      turnText={state && state.phase === 'playing' ? (humanTurn ? messages.gameShell.yourTurn : messages.gameShell.botTurn) : null}
      scores={scores}
      maxRounds={state?.match?.matchPoint ? state.match.targetScore : 1}
      scoreTitle={gameId === 'backgammon' && state?.match?.matchPoint ? `${state.match.targetScore} ${messages.gameShell.points}` : undefined}
      settings={settings}
      settingsPresentation={gameId === 'tic-tac-toe' ? 'collapsed' : 'responsive'}
      winner={winner}
    >
      {!state ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
          <Chip label={messages.gameShell.preparing} variant="outlined" />
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
      <Modal
        open={soundPromptOpen}
        title={messages.sound.consentTitle}
        onClose={() => completeSoundChoice(false)}
        closeLabel={messages.sound.continueSilent}
        confirmLabel={messages.sound.playWithSound}
        onConfirm={() => completeSoundChoice(true)}
      >
        {messages.sound.consentBody}
      </Modal>
    </GameShell>
  );
}

export default function GamePage() {
  const locale = useAppLocale();
  const messages = getMessages(locale);
  return (
    <Suspense fallback={<Typography sx={{ color: 'text.secondary' }}>{messages.common.loading}</Typography>}>
      <GameInner />
    </Suspense>
  );
}
