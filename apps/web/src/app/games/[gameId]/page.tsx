'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Bot, Plus, RefreshCw, Users } from 'lucide-react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import PageContainer from '@/components/layout/PageContainer';
import PageStack from '@/components/layout/PageStack';
import ActionCard from '@/components/shared/ActionCard';
import ActionDeck from '@/components/layout/ActionDeck';
import PageHeader from '@/components/layout/PageHeader';
import GameIdentityMark from '@/components/game/GameIdentityMark';
import { useAppLocale } from '@/hooks/useAppLocale';
import { getMessages } from '@/i18n/messages';
import { localizedAppRoute, localizedGameRoute, localizedPlayRoute } from '@/i18n/routing';
import { getGameCatalogEntry, getGameTitle, isWebGameId } from '@/lib/game-catalog';
import { createRoom, fetchRooms, type Room } from '@/lib/rooms';
import { BACKGAMMON_RULES_PROFILE } from '@bazigb/game-backgammon';

const REFRESH_INTERVAL_MS = 5000;
const MATCH_SUPPORTED = new Set(['tic-tac-toe', 'backgammon']);

const logicalIconSx = {
  '& .MuiButton-startIcon': { marginInlineStart: 0, marginInlineEnd: 1 },
  '& .MuiButton-endIcon': { marginInlineStart: 1, marginInlineEnd: 0 },
};

export default function GameHubPage() {
  const { gameId: rawGameId } = useParams<{ gameId: string }>();
  const router = useRouter();
  const theme = useTheme();
  const locale = useAppLocale();
  const messages = getMessages(locale);
  const gameId = decodeURIComponent(rawGameId ?? '');
  const validGameId = isWebGameId(gameId) ? gameId : null;
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [maxRounds, setMaxRounds] = useState<number>(1);

  const loadRooms = useCallback(async () => {
    if (!validGameId) return;
    try {
      setRooms(await fetchRooms(undefined, validGameId));
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : messages.lobby.loadRoomsError);
    } finally {
      setLoading(false);
    }
  }, [messages.lobby.loadRoomsError, validGameId]);

  useEffect(() => {
    if (!validGameId) return;
    void loadRooms();
    const timer = window.setInterval(() => void loadRooms(), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [loadRooms, validGameId]);

  const activeRooms = useMemo(
    () => rooms.filter((room) => room.status !== 'finished').sort((a, b) => (a.status === b.status ? Date.parse(b.createdAt) - Date.parse(a.createdAt) : a.status === 'waiting' ? -1 : 1)),
    [rooms],
  );

  if (!validGameId) {
    return <PageContainer width="content"><EmptyState title={messages.gameHub.invalidGame} actionLabel={messages.common.back} onAction={() => router.push(localizedAppRoute(locale, 'lobby'))} /></PageContainer>;
  }

  const game = getGameCatalogEntry(validGameId);
  const title = getGameTitle(validGameId, locale);

  const handleCreate = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const room = await createRoom(validGameId, maxRounds);
      router.push(localizedPlayRoute(locale, room.code));
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : messages.lobby.createError);
      setCreating(false);
    }
  };

  const handleJoin = (event: FormEvent) => {
    event.preventDefault();
    const roomCode = code.trim().toUpperCase();
    if (!roomCode) {
      setJoinError(messages.lobby.enterRoomCode);
      return;
    }
    router.push(localizedPlayRoute(locale, roomCode));
  };

  return (
    <Box sx={{ flex: 1 }}>
      <PageContainer width="wide">
        <PageStack>
        <PageHeader title={title} description={messages.gameHub.subtitle(title)} identity={<GameIdentityMark gameId={validGameId} size="large" />} />

        <ActionDeck
          primary={<ActionCard emphasis="primary" title={messages.gameHub.createOnline} description={messages.gameHub.createOnlineDescription} icon={<GameIdentityMark gameId={validGameId} />}>
            {MATCH_SUPPORTED.has(validGameId) && (
              <FormControl fullWidth size="small">
                <InputLabel>{messages.lobby.matchPoints}</InputLabel>
                <Select value={maxRounds} label={messages.lobby.matchPoints} onChange={(event) => setMaxRounds(Number(event.target.value))}>
                  <MenuItem value={1}>{messages.lobby.singleGame}</MenuItem>
                  {validGameId === 'backgammon'
                    ? BACKGAMMON_RULES_PROFILE.targetScores.map((points) => (
                        <MenuItem key={points} value={points}>{points} {messages.gameShell.points}</MenuItem>
                      ))
                    : [
                        <MenuItem key="best-of-3" value={3}>{messages.lobby.bestOf3}</MenuItem>,
                        <MenuItem key="best-of-5" value={5}>{messages.lobby.bestOf5}</MenuItem>,
                      ]}
                </Select>
              </FormControl>
            )}
            {createError && <Alert severity="error">{createError}</Alert>}
            <Button fullWidth variant="contained" size="large" startIcon={<Plus size={20} />} disabled={creating} onClick={() => void handleCreate()} sx={{ ...logicalIconSx, mt: 'auto', fontWeight: 900 }}>
              {messages.gameHub.createOnline}
            </Button>
          </ActionCard>}
          secondary={<ActionCard title={messages.gameHub.playBot} description={messages.gameHub.playBotDescription} icon={<Bot size={24} />}>
            <Button fullWidth variant="outlined" size="large" startIcon={<Bot size={20} />} onClick={() => router.push(localizedGameRoute(locale, validGameId))} sx={{ ...logicalIconSx, fontWeight: 900 }}>
              {messages.gameHub.playBot}
            </Button>
          </ActionCard>}
          tertiary={<form onSubmit={handleJoin} style={{ minWidth: 0, height: '100%' }}>
            <ActionCard title={messages.gameHub.joinByCode} description={messages.gameHub.joinByCodeDescription}>
              <TextField value={code} placeholder="ABCDE" inputProps={{ maxLength: 8, dir: 'ltr', 'aria-label': messages.gameHub.roomCodeHint }} onChange={(event) => { setCode(event.target.value.toUpperCase()); setJoinError(null); }} sx={{ '& input': { textAlign: 'center', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '0.18em' } }} />
              {joinError && <Alert severity="error">{joinError}</Alert>}
              <Button type="submit" fullWidth variant="outlined" size="large" disabled={!code.trim()} sx={{ mt: 'auto', fontWeight: 900 }}>{messages.gameHub.joinByCode}</Button>
            </ActionCard>
          </form>}
        />

        <Box component="section" aria-label={messages.lobby.activeRooms} sx={{ minWidth: 0 }}>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>{messages.lobby.activeRooms}</Typography>
            <Button size="small" startIcon={<RefreshCw size={17} />} onClick={() => void loadRooms()} sx={{ ...logicalIconSx, color: 'text.secondary' }}>{messages.common.refresh}</Button>
          </Box>
          {loadError ? (
            <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void loadRooms()}>{messages.common.retry}</Button>}>{loadError}</Alert>
          ) : loading ? (
            <LoadingSkeleton count={3} height={76} columns={{ xs: 1, sm: 1, md: 1 }} />
          ) : activeRooms.length === 0 ? (
            <EmptyState compact icon={<Users size={24} />} title={messages.lobby.noActiveRooms} actionLabel={messages.gameHub.createOnline} onAction={() => void handleCreate()} />
          ) : (
            <Box sx={{ maxBlockSize: 'min(24rem, 45dvb)', overflowY: 'auto', overscrollBehavior: 'contain', pr: 0.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {activeRooms.map((room) => (
                <Paper key={room.id} elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.55), display: 'flex', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip label={room.status === 'waiting' ? messages.lobby.waiting : messages.lobby.inProgress} size="small" color={room.status === 'waiting' ? 'success' : 'warning'} variant="outlined" />
                    <Typography dir="ltr" sx={{ fontFamily: 'monospace', fontWeight: 900 }}>{room.code}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{messages.lobby.playersShort(room.players.length, game.maxPlayers)}</Typography>
                  </Box>
                  <Button variant="outlined" onClick={() => router.push(localizedPlayRoute(locale, room.code))}>{messages.lobby.enter}</Button>
                </Paper>
              ))}
            </Box>
          )}
        </Box>

        </PageStack>
      </PageContainer>
    </Box>
  );
}
