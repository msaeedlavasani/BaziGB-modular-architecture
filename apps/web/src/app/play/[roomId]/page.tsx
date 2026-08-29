'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { Play, Share2, Undo2, Users } from 'lucide-react';

import { connectSocket, socket, rejoinRoom } from '@/lib/socket';
import { fetchRoom } from '@/lib/rooms';
import { localizedGameHubRoute } from '@/i18n/routing';
import { getMessages } from '@/i18n/messages';
import { getGameShellMessages } from '@/i18n/game-shell';
import { useAppLocale } from '@/hooks/useAppLocale';
import {
  getGameCatalogEntry,
  getGameTitle,
  isWebGameId,
} from '@/lib/game-catalog';

import GameShell from '@/components/game/GameShell';
import TicTacToeBoard from '@/components/game/TicTacToeBoard';
import BackgammonBoard from '@/components/game/BackgammonBoard';
import ChessBoard from '@/components/game/ChessBoard';
import ChessInfo from '@/components/game/ChessInfo';
import VegasBoard from '@/components/game/VegasBoard';
import StatusPill from '@/components/shared/StatusPill';
import type { BackgammonMove } from '@bazigb/game-backgammon';
import type { GameId } from '@bazigb/engine';

type ChatMessage = { type: string; message: string; username?: string; ts: number };

/** Room-based multiplayer page using the shared BaziGB realtime protocol. */
export default function PlayPage() {
  const params = useParams<{ roomId: string }>();
  const theme = useTheme();
  const locale = useAppLocale();
  const messages = getMessages(locale);
  const shellMessages = getGameShellMessages(locale);
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
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

  const normalizeGameId = (value: unknown): GameId =>
    typeof value === 'string' && isWebGameId(value) ? value : 'tic-tac-toe';

  useEffect(() => {
    if (!turnInfo) return;
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [turnInfo]);

  useEffect(() => {
    connectSocket();

    const handlers: Record<string, (payload: any) => void> = {
      gameState: (nextState) => setState(nextState),
      roomUpdate: (nextRoom) => {
        setRoom({
          status: nextRoom.status,
          players: nextRoom.players,
          gameType: normalizeGameId(nextRoom.gameType),
          maxRounds: nextRoom.maxRounds,
        });
        if (nextRoom.status === 'playing' && nextRoom.currentState) setState(nextRoom.currentState);
      },
      matchScore: ({ scores: nextScores }) => setScores(nextScores ?? {}),
      gameOver: ({ winner, scores: nextScores }) => {
        setScores(nextScores ?? {});
        setState((previous: any) => previous ? { ...previous, phase: 'finished', winner } : previous);
      },
      systemMessage: (message) =>
        setChatMessages((previous) => [
          ...previous.slice(-49),
          {
            type: message.type,
            message: message.message,
            username: message.username,
            ts: Date.now(),
          },
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
      seatKey: ({ seatKey }) => {
        if (seatKey && typeof window !== 'undefined') {
          window.sessionStorage.setItem(`bazigb_seat_${roomCode}`, seatKey);
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
      .then((nextRoom) => setRoom({
        status: nextRoom.status,
        players: nextRoom.players,
        gameType: normalizeGameId(nextRoom.gameType),
        maxRounds: nextRoom.maxRounds,
      }))
      .catch(() => undefined);

    return () => {
      Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler as never));
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [roomCode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

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
      // Clipboard availability is non-critical and does not affect gameplay.
    }
  };

  const gameId = room?.gameType ?? 'tic-tac-toe';
  const gameCatalog = getGameCatalogEntry(gameId);
  const isOwner = room?.players[0] === myId;
  const isSpectator = spectating || Boolean(room && room.players.length > 0 && myId && !room.players.includes(myId));
  const humanTurn = Boolean(state && state.phase === 'playing' && state.turn === myId && !isSpectator);
  const isFinished = Boolean(state && state.phase === 'finished');
  const isRoundEnd = gameId === 'backgammon' && state?.phase === 'roundEnd';

  const turnRemainingSec =
    turnInfo && state?.phase === 'playing' && state.turn === myId
      ? Math.max(0, Math.ceil((turnInfo.endsAt - nowMs) / 1000))
      : null;

  const board = (() => {
    if (!state) return null;
    const disabled = !humanTurn;

    switch (gameId) {
      case 'tic-tac-toe':
        return (
          <TicTacToeBoard
            state={state}
            onMove={(move) => socket.emit('makeMove', { roomCode, move })}
            disabled={disabled}
          />
        );
      case 'backgammon':
        return (
          <BackgammonBoard
            state={state}
            onRoll={() => socket.emit('rollDice', { roomCode })}
            onMove={(move: BackgammonMove) => socket.emit('makeMove', { roomCode, move: [move] })}
            onChain={(chain) => socket.emit('makeMove', { roomCode, move: chain })}
            onEndTurn={() => socket.emit('gameAction', { room: roomCode, moveName: 'endTurn' })}
            onOfferDouble={() => socket.emit('double', { room: roomCode })}
            onRespondDouble={(accept) => socket.emit('doubleResponse', { room: roomCode, accept })}
            isMyTurn={humanTurn}
            myColor={state.players?.[0]?.id === myId ? 1 : -1}
          />
        );
      case 'chess':
        return (
          <ChessBoard
            state={state}
            onMove={(move) => socket.emit('makeMove', { roomCode, move })}
            disabled={disabled}
            orientation={state.players?.[0]?.id === myId ? 'w' : 'b'}
          />
        );
      case 'vegas':
        return (
          <VegasBoard
            state={state}
            onMove={(move) => socket.emit('makeMove', { roomCode, move })}
            disabled={disabled}
            youId={myId}
          />
        );
      default:
        return null;
    }
  })();

  const [playerA, playerB] = state?.players ?? [];
  const scoreA = playerA ? (scores[playerA.id] ?? 0) : 0;
  const scoreB = playerB ? (scores[playerB.id] ?? 0) : 0;
  const maxRounds = room?.maxRounds ?? 1;

  const winner = isRoundEnd
    ? {
        label: state.gameWinner === myId ? shellMessages.youWonGame : shellMessages.botWonGame,
        sub: messages.multiplayer.matchScore(scoreA, scoreB),
        onRematch: () => socket.emit('nextRound', { room: roomCode }),
        actionLabel: shellMessages.nextGame,
      }
    : isFinished
    ? {
        label: state.winner
          ? state.winner === myId
            ? messages.gameShell.youWon
            : messages.multiplayer.opponentWon
          : messages.gameShell.draw,
        sub: maxRounds > 1 ? messages.multiplayer.matchScore(scoreA, scoreB) : undefined,
        onRematch: () => socket.emit('newGame', { roomCode }),
      }
    : null;

  const waiting = room?.status === 'waiting' && !isSpectator;
  const timerLabel = turnExpired
    ? messages.multiplayer.turnExpired
    : turnWarned && turnRemainingSec !== null
      ? `${turnRemainingSec}s ⚠️`
      : turnRemainingSec !== null
        ? `${turnRemainingSec}s`
        : null;

  return (
    <GameShell
      title={getGameTitle(gameId, locale) || messages.multiplayer.gameFallback}
      surfaceRatio={getGameCatalogEntry(gameId).surfaceRatio}
      backHref={localizedGameHubRoute(locale, gameId)}
      backLabel={messages.common.back}
      connStatus={connected ? 'connected' : 'reconnecting'}
      roomCode={roomCode}
      onCopyRoom={handleCopy}
      copied={copied}
      turnText={
        isSpectator
          ? messages.multiplayer.liveSpectating
          : state && state.phase === 'playing'
            ? humanTurn
              ? messages.gameShell.yourTurn
              : messages.multiplayer.opponentTurn
            : null
      }
      timerLabel={timerLabel}
      scores={maxRounds > 1 ? { a: scoreA, b: scoreB } : null}
      maxRounds={maxRounds}
      scoreTitle={gameId === 'backgammon' && maxRounds > 1 ? `${maxRounds} ${messages.gameShell.points}` : undefined}
      winner={winner}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', minWidth: 0 }}>
        {!waiting && !isSpectator && state && state.phase === 'playing' && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={() => socket.emit('undo', { room: roomCode })}
              startIcon={<Undo2 size={14} />}
              title={messages.multiplayer.undoOwnMove}
            >
              {messages.gameShell.undo}
            </Button>
          </Box>
        )}

        {isSpectator && !waiting && (
          <Chip
            label={messages.multiplayer.spectatorNotice}
            variant="outlined"
            sx={{
              alignSelf: 'center',
              borderColor: alpha(theme.palette.primary.main, 0.35),
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              color: 'primary.light',
              fontWeight: 700,
            }}
          />
        )}

        {waiting && (
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              maxWidth: 620,
              mx: 'auto',
              p: { xs: 3, sm: 4 },
              borderRadius: 4,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 2,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>
              {messages.multiplayer.waitingForOpponent}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 480 }}>
              {messages.multiplayer.shareRoomCode(roomCode)}
            </Typography>

            {room && (
              <StatusPill
                icon={<Users />}
                label={messages.multiplayer.players(room.players.length, gameCatalog.maxPlayers)}
              />
            )}

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                onClick={handleCopy}
                startIcon={copied ? undefined : <Share2 size={16} />}
                sx={{ borderColor: alpha(theme.palette.primary.main, 0.35), fontWeight: 800 }}
              >
                {copied ? messages.multiplayer.copied : messages.multiplayer.copyCode}
              </Button>
              {room && room.players.length >= 2 && isOwner && (
                <Button variant="contained" onClick={startGame} startIcon={<Play size={16} />} sx={{ fontWeight: 900 }}>
                  {messages.multiplayer.startGame}
                </Button>
              )}
            </Box>

            {room && room.players.length >= 2 && !isOwner && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {messages.multiplayer.ownerStarting}
              </Typography>
            )}
          </Paper>
        )}

        {state && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', minWidth: 0 }}>
            {board}
            {gameId === 'chess' && <ChessInfo state={state} />}
          </Box>
        )}

        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 520,
            mx: 'auto',
            borderRadius: 3,
            bgcolor: alpha(theme.palette.background.paper, 0.5),
            overflow: 'hidden',
          }}
        >
          <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'start' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.08em', color: 'text.secondary' }}>
              {messages.multiplayer.chat}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, px: 2, py: 1.5, maxHeight: 180, overflowY: 'auto' }}>
            {chatMessages.length === 0 && (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {messages.multiplayer.noMessages}
              </Typography>
            )}

            {chatMessages.map((message, index) => {
              const speaker = message.type === 'chat'
                ? message.username ?? messages.multiplayer.guest
                : message.type === 'success'
                  ? messages.multiplayer.system
                  : message.username ?? messages.multiplayer.system;
              const speakerColor = message.type === 'success'
                ? theme.palette.primary.main
                : theme.palette.text.primary;

              return (
                <Box key={`${message.ts}-${index}`} sx={{ textAlign: 'start' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', wordBreak: 'break-word' }}>
                    <Box component="span" sx={{ color: speakerColor, fontWeight: 800 }}>
                      {speaker}:
                    </Box>{' '}
                    {message.message}
                  </Typography>
                </Box>
              );
            })}
            <div ref={chatEndRef} />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1, px: 2, pb: 1.5 }}>
            <TextField
              fullWidth
              placeholder={messages.multiplayer.messagePlaceholder}
              value={chat}
              onChange={(event) => setChat(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendChat();
                }
              }}
            />
            <Button variant="outlined" color="primary" onClick={sendChat} disabled={!chat.trim()} sx={{ flexShrink: 0, fontWeight: 800 }}>
              {messages.multiplayer.send}
            </Button>
          </Box>
        </Paper>
      </Box>

      <Snackbar open={Boolean(error)} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </GameShell>
  );
}
