'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  TextField,
  InputAdornment,
  Paper,
  Stack,
  Avatar,
  Chip,
  LinearProgress,
  Skeleton,
  Alert,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import { Crown, Medal, RefreshCw, Search, Trophy } from 'lucide-react';
import { fetchLeaderboard, LeaderboardEntry } from '../../lib/leaderboard';
import { useAuth } from '@/hooks/useAuth';

/* ------------------------------- styling -------------------------------- */

const RANK_META: Record<
  number,
  { ring: string; badge: string; color: string; label: string }
> = {
  1: {
    ring: '#fbbf2499', // ring-amber-400/60
    badge: '#EAB308',
    color: '#EAB308',
    label: 'Gold',
  },
  2: {
    ring: '#BEBBAC99', // ring-slate-300/60
    badge: '#BEBBAC',
    color: '#BEBBAC',
    label: 'Silver',
  },
  3: {
    ring: '#d9770699', // ring-amber-600/60
    badge: '#D97706',
    color: '#D97706',
    label: 'Bronze',
  },
};

const MEDAL_ICON: Record<number, React.ReactNode> = {
  1: <Crown size={20} />,
  2: <Medal size={20} />,
  3: <Medal size={20} />,
};

function WinRateBar({ value }: { value: number }) {
  return (
    <Box sx={{ width: { xs: 52, sm: 80 }, height: 6, borderRadius: 10, bgcolor: 'rgba(44, 58, 69, 0.7)', overflow: 'hidden' }}>
      <Box
        sx={{
          height: '100%',
          borderRadius: 10,
          background: '#F5A306',
          width: `${Math.min(100, Math.max(0, value))}%`,
        }}
      />
    </Box>
  );
}

function SkeletonRows() {
  return (
    <Stack spacing={1}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Paper
          key={i}
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: alpha('#0B1622', 0.6),
          }}
        >
          <Skeleton variant="rectangular" width={24} height={20} />
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={128} height={20} />
            <Skeleton variant="text" width={96} height={14} />
          </Box>
          <Skeleton variant="rectangular" width={56} height={24} />
        </Paper>
      ))}
    </Stack>
  );
}

/* ------------------------------- page ------------------------------------ */

export default function LeaderboardPage() {
  const { user } = useAuth();
  const theme = useTheme();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeaderboard();
      setEntries(data);
    } catch (e: any) {
      setError(e?.message || 'Could not load the leaderboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.username.toLowerCase().includes(q));
  }, [entries, query]);

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as LeaderboardEntry[];

  return (
    <Box sx={{ flex: 1, bgcolor: 'background.default' }}>
      <Container maxWidth="md" sx={{ py: 6 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 2,
            mb: 4,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Trophy size={32} style={{ color: '#fbbf24' }} />
              Leaderboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Top 50 players ranked by competitive rating.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => void load()}
            disabled={loading}
            startIcon={
              <RefreshCw
                size={16}
                className={loading ? 'animate-spin' : ''}
              />
            }
            sx={{
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'text.primary',
                color: 'text.primary',
                bgcolor: alpha(theme.palette.text.primary, 0.05),
              },
            }}
          >
            Refresh
          </Button>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search players by username…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          variant="outlined"
          sx={{
            mb: 4,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: alpha(theme.palette.background.default, 0.7),
              '& fieldset': { borderColor: 'divider' },
              '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.5) },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} style={{ color: theme.palette.text.disabled }} />
              </InputAdornment>
            ),
          }}
        />

        {error && (
          <Alert severity="error" variant="outlined" sx={{ mb: 4, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Podium */}
        {!loading && top3.length > 0 && (
          <Box
            component="section"
            aria-label="Top 3"
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'flex-end' },
              justifyContent: 'center',
              gap: { xs: 2, sm: 3 },
              mb: 6,
            }}
          >
            {podiumOrder.map((entry) => {
              const meta = RANK_META[entry.rank];
              const isFirst = entry.rank === 1;
              return (
                <Paper
                  key={entry.userId}
                  elevation={0}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: isFirst ? { xs: 2, sm: 3 } : { xs: 1.5, sm: 2.5 },
                    pt: 3,
                    pb: isFirst ? 4 : 3,
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                    boxShadow: isFirst ? `0 10px 25px -5px ${alpha(theme.palette.common.black, 0.3)}` : 'none',
                    minWidth: { xs: '100%', sm: 140 },
                    order: { xs: entry.rank, sm: 0 },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: isFirst ? 56 : 48,
                      height: isFirst ? 56 : 48,
                      borderRadius: '50%',
                      background: meta.color,
                      boxShadow: `0 0 0 2px ${meta.ring}`,
                      mb: 2,
                    }}
                  >
                    {MEDAL_ICON[entry.rank]}
                  </Box>
                  <Box sx={{ textAlign: 'center', width: '100%' }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 800,
                        fontSize: isFirst ? '1.1rem' : '0.9rem',
                        maxWidth: '100%',
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                      }}
                      title={entry.username}
                    >
                      {entry.username}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'text.secondary',
                      }}
                    >
                      #{entry.rank} • {meta.label}
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        color: '#fcd34d',
                        mt: 1.5,
                        fontSize: isFirst ? '1.5rem' : '1.25rem',
                      }}
                    >
                      {entry.rating}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'text.disabled',
                        fontSize: '10px',
                      }}
                    >
                      rating
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}

        {/* Ranked list */}
        <Box component="section">
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: 'text.secondary', mb: 2 }}
          >
            Full Rankings
            <Box component="span" sx={{ ml: 1, fontSize: '0.875rem', fontWeight: 500, color: 'text.disabled' }}>
              {loading ? '…' : `${filtered.length} ${filtered.length === 1 ? 'player' : 'players'}`}
            </Box>
          </Typography>

          {loading ? (
            <SkeletonRows />
          ) : filtered.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 4,
                borderStyle: 'dashed',
                bgcolor: 'transparent',
              }}
            >
              <Search size={32} style={{ color: theme.palette.text.disabled, margin: '0 auto' }} />
              <Typography sx={{ mt: 2, fontWeight: 600, color: 'text.secondary' }}>
                No players found
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                Nobody matches “{query}” — try a different username.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={1}>
              {filtered.map((entry) => {
                const meta = RANK_META[entry.rank];
                const isMe = user?.id === entry.userId;
                return (
                  <Paper
                    key={entry.userId}
                    elevation={0}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: { xs: 1, sm: 2 },
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: isMe ? alpha(theme.palette.primary.main, 0.5) : 'divider',
                      bgcolor: isMe ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.background.paper, 0.6),
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: isMe ? alpha(theme.palette.primary.main, 0.7) : 'text.disabled',
                      },
                    }}
                  >
                    {/* Rank badge */}
                    <Box sx={{ width: { xs: 30, sm: 40 }, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                      {meta ? (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: meta.badge,
                          }}
                        >
                          {MEDAL_ICON[entry.rank]}
                        </Box>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'text.disabled' }}
                        >
                          {entry.rank}
                        </Typography>
                      )}
                    </Box>

                    {/* Avatar */}
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        fontWeight: 800,
                        fontSize: '0.875rem',
                        background: meta ? meta.color : '#F5A306',
                      }}
                    >
                      {entry.username.charAt(0).toUpperCase() || '?'}
                    </Avatar>

                    {/* Identity + stats */}
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            wordBreak: 'break-word',
                            whiteSpace: 'normal',
                          }}
                        >
                          {entry.username}
                        </Typography>
                        {isMe && (
                          <Chip
                            label="You"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '10px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              bgcolor: alpha(theme.palette.primary.main, 0.2),
                              color: 'primary.light',
                            }}
                          />
                        )}
                      </Box>
                      <Stack direction="row" spacing={1.5} sx={{ mt: 0.5, alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          <Box component="span" sx={{ fontWeight: 700, color: '#10b981' }}>
                            {entry.wins}W
                          </Box>
                          <Box component="span" sx={{ mx: 0.5, color: 'text.disabled' }}>
                            /
                          </Box>
                          <Box component="span" sx={{ fontWeight: 700, color: '#f43f5e' }}>
                            {entry.losses}L
                          </Box>
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ display: { xs: 'none', sm: 'block' } }}>
                          {entry.gamesPlayed} games
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WinRateBar value={entry.winRate} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {entry.winRate}%
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    {/* Rating */}
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#F5A306', lineHeight: 1 }}>
                        {entry.rating}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: 'text.disabled',
                          fontSize: '10px',
                        }}
                      >
                        rating
                      </Typography>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>
      </Container>
    </Box>
  );
}
