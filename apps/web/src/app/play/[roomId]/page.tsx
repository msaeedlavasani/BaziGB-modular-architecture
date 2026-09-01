'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { Link2Off, Play, Share2, Undo2, Users } from 'lucide-react';

import { connectSocket, socket, rejoinRoom } from '@/lib/socket';
import { fetchRoom } from '@/lib/rooms';
import { localizedAppRoute, localizedGameHubRoute } from '@/i18n/routing';
import { getMessages } from '@/i18n/messages';
import { getGameShellMessages } from '@/i18n/game-shell';
import { useAppLocale } from '@/hooks/useAppLocale';
import {
  getGameCatalogEntry,
  getGameTitle,
  isWebGameId,
} from '@/lib/game-catalog';

import GameShell from '@/components/game/GameShell';
import ParticipantStrip, { type RoomParticipant } from '@/components/game/ParticipantStrip';
import TicTacToeBoard from '@/components/game/TicTacToeBoard';
import BackgammonBoard from '@/components/game/BackgammonBoard';
import ChessBoard from '@/components/game/ChessBoard';
import ChessInfo from '@/components/game/ChessInfo';
import VegasBoard from '@/components/game/VegasBoard';
import StatusPill from '@/components/shared/StatusPill';
import Modal from '@/components/shared/Modal';
import EmptyState from '@/components/shared/EmptyState';
import { soundService } from '@/lib/sound-service';
import type { BackgammonMove } from '@bazigb/game-backgammon';
import type { GameId } from '@bazigb/engine';

type ChatMessage = { type: string; message: string; username?: string; ts: number };
type SessionNoticeKind =
  | 'player-reconnecting'
  | 'player-reconnected'
  | 'game-ended-by-creator'
  | 'game-ended-by-player'
  | 'game-ended-after-disconnect';

type SessionNotice = { kind: SessionNoticeKind; participantId?: string };

/** Room-based multiplayer page using the shared BaziGB realtime protocol. */
export default function PlayPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
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
    ownerId: string | null;
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
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [sessionNotice, setSessionNotice] = useState<SessionNotice | null>(null);
  const [pendingExitHref, setPendingExitHref] = useState<string | null>(null);
  const [roomLookupFailed, setRoomLookupFailed] = useState(false);
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
        setRoomLookupFailed(false);
        setRoom({
          status: nextRoom.status,
          players: nextRoom.players,
          gameType: normalizeGameId(nextRoom.gameType),
          maxRounds: nextRoom.maxRounds,
          ownerId: nextRoom.ownerId ?? null,
        });
        if (nextRoom.status === 'playing' && nextRoom.currentState) setState(nextRoom.currentState);
      },
      matchScore: ({ scores: nextScores }) => setScores(nextScores ?? {}),
      gameOver: ({ winner, scores: nextScores, reason }) => {
        setScores(nextScores ?? {});
        setState((previous: any) => previous ? { ...previous, phase: 'finished', winner } : previous);
        if (!winner) soundService.play('draw');
        else if (winner === socket.id) soundService.play('win');
        else soundService.play('loss');
        if (reason === 'creator-ended') setSessionNotice({ kind: 'game-ended-by-creator' });
        if (reason === 'player-left') setSessionNotice({ kind: 'game-ended-by-player' });
        if (reason === 'reconnect-timeout') setSessionNotice({ kind: 'game-ended-after-disconnect' });
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
        if (player === socket.id) soundService.play('your-turn');
      },
      turnWarning: ({ player }) => {
        setTurnWarned(true);
        if (player === socket.id) soundService.play('turn-warning');
      },
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
      presenceUpdate: ({ participants: nextParticipants }) => {
        setParticipants(Array.isArray(nextParticipants) ? nextParticipants : []);
      },
      sessionNotice: (notice) => {
        if (notice?.kind === 'game-started') soundService.play('game-start');
        if (notice?.kind === 'player-reconnected') soundService.play('reconnected');
        if (notice?.kind && notice.kind !== 'game-started') setSessionNotice(notice);
      },
      reaction: ({ username, reaction }) => {
        setChatMessages((previous) => [
          ...previous.slice(-49),
          { type: 'reaction', message: reaction, username, ts: Date.now() },
        ]);
      },
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
        ownerId: nextRoom.ownerId,
      }))
      .catch(() => setRoomLookupFailed(true));

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
  const isOwner = room?.ownerId === myId;
  const isSpectator = spectating || Boolean(room && room.players.length > 0 && myId && !room.players.includes(myId));
  const humanTurn = Boolean(state && state.phase === 'playing' && state.turn === myId && !isSpectator);
  const isFinished = Boolean(state && state.phase === 'finished');
  const isRoundEnd = gameId === 'backgammon' && state?.phase === 'roundEnd';
  const gameHubHref = localizedGameHubRoute(locale, gameId);
  const lobbyHref = localizedAppRoute(locale, 'lobby');
  const activePlayerSession = Boolean(
    room &&
    room.status !== 'finished' &&
    room.players.includes(myId) &&
    !isSpectator,
  );

  const requestExit = useCallback((href: string) => {
    if (!activePlayerSession) {
      router.push(href);
      return;
    }
    setPendingExitHref(href);
  }, [activePlayerSession, router]);

  useEffect(() => {
    const handleHeaderExit = (event: Event) => {
      const detail = (event as CustomEvent<{ href?: string }>).detail;
      requestExit(detail?.href ?? lobbyHref);
    };
    window.addEventListener('bazigb:request-game-exit', handleHeaderExit);
    return () => window.removeEventListener('bazigb:request-game-exit', handleHeaderExit);
  }, [lobbyHref, requestExit]);

  useEffect(() => {
    if (!activePlayerSession) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [activePlayerSession]);

  const confirmExit = () => {
    const href = pendingExitHref;
    setPendingExitHref(null);
    socket.emit('leaveRoom', { roomCode });
    if (href) router.push(href);
  };

  useEffect(() => {
    if (sessionNotice?.kind !== 'player-reconnected') return;
    const timer = window.setTimeout(() => setSessionNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [sessionNotice]);

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
        secondaryHref: lobbyHref,
        secondaryLabel: messages.multiplayer.backToLobby,
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
        actionLabel: gameId === 'tic-tac-toe' ? messages.multiplayer.playSameGame : undefined,
        secondaryHref: lobbyHref,
        secondaryLabel: messages.multiplayer.backToLobby,
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

  const noticeParticipant = sessionNotice?.participantId
    ? participants.find((participant) => participant.id === sessionNotice.participantId)
    : null;
  const noticeText = sessionNotice?.kind === 'player-reconnecting'
    ? messages.multiplayer.reconnectingPlayer(noticeParticipant?.name ?? messages.multiplayer.player)
    : sessionNotice?.kind === 'player-reconnected'
      ? messages.multiplayer.playerReconnected(noticeParticipant?.name ?? messages.multiplayer.player)
      : sessionNotice?.kind === 'game-ended-by-creator'
        ? messages.multiplayer.endedByCreator
        : sessionNotice?.kind === 'game-ended-by-player'
          ? messages.multiplayer.endedByPlayer
          : sessionNotice?.kind === 'game-ended-after-disconnect'
            ? messages.multiplayer.endedAfterDisconnect
            : null;

  return (
    <GameShell
      title={getGameTitle(gameId, locale) || messages.multiplayer.gameFallback}
      surfaceRatio={getGameCatalogEntry(gameId).surfaceRatio}
      backHref={localizedGameHubRoute(locale, gameId)}
      backLabel={messages.common.back}
      onBack={() => requestExit(gameHubHref)}
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
        {roomLookupFailed && !room && (
          <EmptyState
            icon={<Link2Off size={26} />}
            title={locale === 'fa' ? 'این اتاق پیدا نشد یا منقضی شده است' : 'This room was not found or has expired'}
            description={locale === 'fa' ? 'کد دعوت را بررسی کنید یا از صفحهٔ بازی یک اتاق تازه بسازید.' : 'Check the invite code or create a fresh room from the game page.'}
            actionLabel={locale === 'fa' ? 'بازگشت به صفحهٔ بازی' : 'Back to game page'}
            onAction={() => router.push(gameHubHref)}
          />
        )}
        {participants.length > 0 && (
          <ParticipantStrip
            participants={participants}
            currentTurnId={state?.turn ?? null}
            myId={myId}
            labels={{
              title: messages.multiplayer.participants,
              you: messages.multiplayer.you,
              creator: messages.multiplayer.creator,
              player: messages.multiplayer.player,
              spectator: messages.multiplayer.spectator,
              reconnecting: messages.multiplayer.reconnectingPlayer,
              reconnectingShort: locale === 'fa' ? 'در حال بازگشت' : 'Reconnecting',
            }}
          />
        )}

        {noticeText && (
          <Alert severity={sessionNotice?.kind === 'player-reconnected' ? 'success' : sessionNotice?.kind === 'player-reconnecting' ? 'warning' : 'info'} sx={{ width: '100%', maxWidth: 680, mx: 'auto' }}>
            {noticeText}
          </Alert>
        )}
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

        {!roomLookupFailed && <Paper
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
          <Box role="group" aria-label={messages.multiplayer.reactions} sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, px: 2, pb: 1.5 }}>
            {(['👏', '🔥', '😂', '❤️'] as const).map((reaction) => (
              <Button
                key={reaction}
                size="small"
                aria-label={`${messages.multiplayer.reactions}: ${reaction}`}
                onClick={() => socket.emit('reaction', { room: roomCode, reaction })}
                sx={{ minWidth: 40, fontSize: '1.1rem' }}
              >
                {reaction}
              </Button>
            ))}
          </Box>
        </Paper>}
      </Box>

      <Snackbar open={Boolean(error)} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      <Modal
        open={Boolean(pendingExitHref)}
        title={messages.multiplayer.exitTitle}
        onClose={() => setPendingExitHref(null)}
        closeLabel={messages.multiplayer.stayInGame}
        confirmLabel={messages.multiplayer.confirmExit}
        onConfirm={confirmExit}
      >
        {isOwner ? messages.multiplayer.exitCreatorBody : messages.multiplayer.exitPlayerBody}
      </Modal>
    </GameShell>
  );
}
