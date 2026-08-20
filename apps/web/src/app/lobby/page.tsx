'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Copy,
  Gamepad2,
  Loader2,
  Plus,
  RefreshCw,
  Users,
  Bot,
  Banknote,
} from 'lucide-react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  alpha,
  useTheme,
  Grid,
  ButtonBase,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { createRoom, fetchRooms, Room } from '../../lib/rooms';

const REFRESH_INTERVAL_MS = 5000;

const STATUS_LABEL: Record<Room['status'], string> = {
  waiting: 'Waiting',
  playing: 'In progress',
  finished: 'Finished',
};

type GameType = 'tic-tac-toe' | 'chess' | 'backgammon' | 'vegas';

const GAME_OPTIONS: GameType[] = ['tic-tac-toe', 'chess', 'backgammon', 'vegas'];

const GAME_META: Record<string, { label: string; tagline: string; isNew?: boolean }> = {
  'tic-tac-toe': { label: 'Tic-Tac-Toe', tagline: 'Classic 3×3 duel' },
  chess: { label: 'Chess', tagline: 'Full board battle' },
  backgammon: { label: 'Backgammon', tagline: 'Dices & Strategy' },
  vegas: { label: 'Vegas', tagline: 'Casino Dice Luck', isNew: true },
};

function GameIcon({ game, sx }: { game: string; sx?: any }) {
  if (game === 'chess') {
    return (
      <Box component="span" sx={{ fontSize: '1.5rem', lineHeight: 1, userSelect: 'none', ...sx }} aria-hidden>
        ♞
      </Box>
    );
  }
  if (game === 'backgammon') {
    return (
      <Box component="span" sx={{ fontSize: '1.5rem', lineHeight: 1, userSelect: 'none', ...sx }} aria-hidden>
        🎲
      </Box>
    );
  }
  if (game === 'vegas') {
    return <Banknote size={sx?.fontSize === 'text-2xl' ? 24 : 20} />;
  }
  return (
    <Box
      component="svg"
      viewBox="0 0 24 24"
      sx={{
        width: 24,
        height: 24,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2.2,
        strokeLinecap: 'round',
        ...sx
      }}
      aria-hidden
    >
      <path d="M3 8h18M3 16h18M8 3v18M16 3v18" />
    </Box>
  );
}

export default function LobbyPage() {
  const router = useRouter();
  const theme = useTheme();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [mode, setMode] = useState<'online' | 'bot'>('online');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [gameType, setGameType] = useState<GameType>('tic-tac-toe');
  const [maxRounds, setMaxRounds] = useState<1 | 3 | 5>(1);

  const MATCH_POINTS_OPTIONS: { value: 1 | 3 | 5; label: string }[] = [
    { value: 1, label: 'Single game (1 point)' },
    { value: 3, label: 'Best of 3 — first to 2' },
    { value: 5, label: 'Best of 5 — first to 3' },
  ];

  const loadRooms = useCallback(async () => {
    try {
      const data = await fetchRooms();
      setRooms(data);
      setLoadError(null);
    } catch (e: any) {
      setLoadError(e?.message || 'Could not load rooms. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
    const timer = setInterval(loadRooms, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadRooms]);

  const handleCreate = async () => {
    // حالت ربات: مستقیم به بازی محلی میرود (بدون اتاق)
    if (mode === 'bot') {
      router.push(`/game/${gameType}`);
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const room = await createRoom(gameType, maxRounds);
      router.push(`/play/${room.code}`);
    } catch (e: any) {
      setCreateError(e?.message || 'Could not create a room');
      setCreating(false);
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (!code) {
      setJoinError('Enter a room code first');
      return;
    }
    router.push(`/play/${code}`);
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  const activeRooms = rooms
    .filter((r) => r.status !== 'finished')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'waiting' ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <Box
      sx={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        p: { xs: 2, sm: 3 },
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
        <Box sx={{ maxWidth: 'sm', width: '100%', display: 'flex', flexDirection: 'column', gap: { xs: 3, sm: 4 }, py: { xs: 2, sm: 4 } }}>
          <Box component="header" sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: 'primary.main', // Honey Bronze
                textShadow: '0 2px 10px rgba(238, 172, 47, 0.2)',
              }}
            >
              BaziGB Lobby
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, opacity: 0.8 }}>
              Create a room or join a friend with a code
            </Typography>
          </Box>

          {/* Create / Join actions */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '16px',
                bgcolor: 'background.paper', // Prussian Blue
                border: '1px solid',
                borderColor: 'divider', // Dark Coffee
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <Typography
                variant="overline"
                sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.1em' }}
              >
                Select Game
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                {GAME_OPTIONS.map((type) => {
                  const meta = GAME_META[type];
                  const selected = gameType === type;
                  return (
                    <ButtonBase
                      key={type}
                      onClick={() => setGameType(type)}
                      sx={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                        p: 2,
                        borderRadius: '12px',
                        border: '2px solid',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        bgcolor: selected ? alpha(theme.palette.primary.main, 0.08) : 'rgba(0,0,0,0.2)',
                        borderColor: selected ? 'primary.main' : 'transparent',
                        color: selected ? 'primary.main' : 'text.secondary',
                        '&:hover': {
                          bgcolor: selected ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.text.primary, 0.04),
                          borderColor: selected ? 'primary.main' : alpha(theme.palette.divider, 0.5),
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box sx={{ color: 'inherit', display: 'flex', transform: selected ? 'scale(1.1)' : 'none', transition: 'transform 0.2s' }}>
                        <GameIcon game={type} sx={{ fontSize: '1.75rem' }} />
                      </Box>
                      <Box sx={{ textAlign: 'center', minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800 }} noWrap>
                          {meta.label}
                        </Typography>
                        {meta.isNew && (
                          <Chip 
                            label="NEW" 
                            size="small" 
                            sx={{ 
                              height: 16, 
                              fontSize: '8px', 
                              fontWeight: 900, 
                              bgcolor: 'success.main', 
                              color: 'white',
                              mt: 0.5
                            }} 
                          />
                        )}
                      </Box>
                    </ButtonBase>
                  );
                })}
              </Box>

              {(gameType === 'backgammon' || gameType === 'tic-tac-toe') && (
                <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                  <InputLabel id="match-points-label" sx={{ color: 'text.secondary' }}>Match Points</InputLabel>
                  <Select
                    labelId="match-points-label"
                    label="Match Points"
                    value={maxRounds}
                    onChange={(e) => setMaxRounds(e.target.value as 1 | 3 | 5)}
                    sx={{
                      borderRadius: '10px',
                      bgcolor: 'rgba(0,0,0,0.2)',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                    }}
                  >
                    {MATCH_POINTS_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value} sx={{ fontWeight: 600 }}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* انتخاب نوع بازی: با حریف آنلاین یا با ربات */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1,
                  '& .MuiButtonBase-root': { borderRadius: '10px', fontWeight: 800 },
                }}
              >
                <ButtonBase
                  onClick={() => setMode('online')}
                  sx={{
                    p: 1.25,
                    border: '1px solid',
                    borderColor: mode === 'online' ? 'primary.main' : 'divider',
                    bgcolor: mode === 'online' ? alpha(theme.palette.primary.main, 0.12) : 'rgba(0,0,0,0.2)',
                    color: mode === 'online' ? 'primary.main' : 'text.secondary',
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Users size={18} />
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      با حریف آنلاین
                    </Typography>
                  </Box>
                </ButtonBase>
                <ButtonBase
                  onClick={() => setMode('bot')}
                  sx={{
                    p: 1.25,
                    border: '1px solid',
                    borderColor: mode === 'bot' ? 'primary.main' : 'divider',
                    bgcolor: mode === 'bot' ? alpha(theme.palette.primary.main, 0.12) : 'rgba(0,0,0,0.2)',
                    color: mode === 'bot' ? 'primary.main' : 'text.secondary',
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Bot size={18} />
                    <Typography variant="caption" sx={{ fontWeight: 800 }}>
                      با ربات
                    </Typography>
                  </Box>
                </ButtonBase>
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={handleCreate}
                disabled={creating}
                startIcon={creating ? <CircularProgress size={20} color="inherit" /> : mode === 'bot' ? <Bot size={20} /> : <Plus size={20} />}
                sx={{
                  py: 1.5,
                  borderRadius: '12px',
                  bgcolor: 'primary.main',
                  color: 'background.default',
                  fontWeight: 800,
                  boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                  '&:hover': {
                    bgcolor: 'primary.light',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': { transform: 'scale(0.98)' },
                }}
              >
                {mode === 'bot' ? 'شروع بازی با ربات' : 'Create Room'}
              </Button>
            </Paper>

            <Paper
              component="form"
              onSubmit={handleJoinByCode}
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '16px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                height: '100%',
                boxShadow: '0 8px 322px rgba(0,0,0,0.4)',
              }}
            >
              <Typography
                variant="overline"
                sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.1em' }}
              >
                Join by code
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 'auto' }}>
                <TextField
                  fullWidth
                  size="small"
                  value={codeInput}
                  placeholder="ABCDE"
                  onChange={(e) => {
                    setCodeInput(e.target.value.toUpperCase());
                    setJoinError(null);
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(0,0,0,0.2)',
                      borderRadius: '10px',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      letterSpacing: '0.2em',
                    }
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!codeInput.trim()}
                  sx={{
                    minWidth: 56,
                    borderRadius: '10px',
                    bgcolor: 'text.primary',
                    color: 'background.default',
                    '&:hover': { bgcolor: 'text.secondary' },
                  }}
                >
                  <ArrowRight size={20} />
                </Button>
              </Box>
              {joinError && (
                <Alert severity="error" variant="filled" sx={{ py: 0, px: 1, borderRadius: '8px', fontSize: '0.75rem' }}>
                  {joinError}
                </Alert>
              )}
            </Paper>
          </Box>

          {(createError || loadError) && (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: 3, borderColor: alpha('#f43f5e', 0.5) }}>
              {createError || loadError}
            </Alert>
          )}

          {/* Room list */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Gamepad2 size={20} style={{ color: '#F5A306' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: alpha('#BEBBAC', 0.9) }}>
                  Active Rooms
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={loadRooms}
                startIcon={<RefreshCw size={16} />}
                sx={{ color: 'text.secondary', textTransform: 'none', '&:hover': { color: 'white' } }}
              >
                Refresh
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={32} sx={{ color: 'text.disabled' }} />
              </Box>
            ) : activeRooms.length === 0 ? (
              <Box
                sx={{
                  borderRadius: 4,
                  border: '2px dashed',
                  borderColor: 'divider',
                  p: 6,
                  textAlign: 'center',
                }}
              >
                <Typography sx={{ color: 'text.disabled' }}>
                  No active rooms yet — create the first one!
                </Typography>
              </Box>
            ) : (
              <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {activeRooms.map((room) => (
                  <Paper
                    key={room.id}
                    component="li"
                    elevation={0}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      borderRadius: 4,
                      bgcolor: alpha('#0B1622', 0.6),
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'border-color 0.2s',
                      '&:hover': {
                        borderColor: alpha('#F5A306', 0.5),
                      },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '1.125rem',
                            fontWeight: 700,
                            letterSpacing: '0.2em',
                          }}
                        >
                          {room.code}
                        </Typography>
                         <Tooltip title={copiedCode === room.code ? "Copied!" : "Copy code"}>
                           <IconButton
                             size="small"
                             onClick={() => handleCopy(room.code)}
                             aria-label={copiedCode === room.code ? "کپی شد" : "کپی کد اتاق"}
                             sx={{ color: 'text.disabled', '&:hover': { color: 'white' } }}
                           >
                             {copiedCode === room.code ? (
                               <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 600 }}>
                                 Copied!
                               </Typography>
                             ) : (
                               <Copy size={16} />
                             )}
                           </IconButton>
                         </Tooltip>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                        <Chip
                          icon={<GameIcon game={room.gameType} sx={{ fontSize: '0.875rem', color: 'inherit' }} />}
                          label={GAME_META[room.gameType]?.label ?? room.gameType}
                          size="small"
                          sx={{
                            height: 24,
                            bgcolor: alpha('#B25D16', 0.1),
                            color: '#F5A306',
                            fontWeight: 600,
                            border: '1px solid',
                            borderColor: alpha('#F5A306', 0.2),
                            '& .MuiChip-icon': {
                              ml: 0.5,
                              mr: -0.5,
                            },
                          }}
                        />
                        <Chip
                          label={STATUS_LABEL[room.status]}
                          size="small"
                          sx={{
                            height: 24,
                            bgcolor: room.status === 'waiting' ? alpha('#10b981', 0.1) : alpha('#f59e0b', 0.1),
                            color: room.status === 'waiting' ? '#4ade80' : '#fbbf24',
                            fontWeight: 600,
                            '&::before': {
                              content: '""',
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: 'currentColor',
                              mr: 1,
                            },
                          }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                          <Users size={14} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {room.players.length}/{room.gameType === 'vegas' ? 5 : 2}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => router.push(`/play/${room.code}`)}
                      disabled={room.status !== 'waiting'}
                      sx={{
                        borderRadius: 2.5,
                        px: 3,
                        bgcolor: alpha('#B25D16', 0.8),
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: '#B25D16',
                        },
                        '&:disabled': {
                          bgcolor: alpha('#2C3A45', 0.8),
                          color: 'text.disabled',
                        },
                      }}
                    >
                      {room.status === 'waiting' ? 'Join' : 'Playing'}
                    </Button>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        </Box>
    </Box>
  );
}
