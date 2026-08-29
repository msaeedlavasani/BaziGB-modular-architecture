'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Avatar,
  Chip,
  Skeleton,
  Alert,
  alpha,
  useTheme,
} from '@mui/material';
import { Crown, Medal, RefreshCw, Trophy } from 'lucide-react';
import { fetchLeaderboard, LeaderboardEntry } from '../../lib/leaderboard';
import { useAuth } from '@/hooks/useAuth';
import { useAppLocale } from '@/hooks/useAppLocale';
import { getLeaderboardMessages } from '@/i18n/leaderboard';
import EmptyState from '@/components/shared/EmptyState';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import PageStack from '@/components/layout/PageStack';

const RANK_META: Record<number, { ring: string; badge: string; color: string }> = {
  1: { ring: '#fbbf2499', badge: '#EAB308', color: '#EAB308' },
  2: { ring: '#BEBBAC99', badge: '#BEBBAC', color: '#BEBBAC' },
  3: { ring: '#d9770699', badge: '#D97706', color: '#D97706' },
};

const MEDAL_ICON: Record<number, React.ReactNode> = {
  1: <Crown size={20} />,
  2: <Medal size={20} />,
  3: <Medal size={20} />,
};

const PAGE_SIZE = 10;

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

export default function LeaderboardPage() {
  const { user } = useAuth();
  const theme = useTheme();
  const locale = useAppLocale();
  const messages = getLeaderboardMessages(locale);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [demo, setDemo] = useState(false);

  const rankLabel = (rank: number): string => {
    if (rank === 1) return messages.gold;
    if (rank === 2) return messages.silver;
    return messages.bronze;
  };

  const load = useCallback(async (requestedPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeaderboard(requestedPage, PAGE_SIZE);
      setEntries(data.items);
      setPage(data.page);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setDemo(data.demo);
    } catch (e: any) {
      setError(e?.message || messages.loadError);
    } finally {
      setLoading(false);
    }
  }, [messages.loadError]);

  useEffect(() => {
    void load(1);
  }, [load]);

  const top3 = page === 1 ? entries.slice(0, 3) : [];
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean) as LeaderboardEntry[];

  return (
    <Box sx={{ flex: 1, bgcolor: 'background.default' }}>
      <PageContainer width="content">
        <PageStack>
          <PageHeader
            title={messages.title}
            description={messages.subtitle}
            identity={<Trophy size={32} aria-hidden="true" />}
          />
          <Button
            variant="outlined"
            onClick={() => void load(page)}
            disabled={loading}
            startIcon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
            sx={{
              borderColor: 'divider',
              color: 'text.secondary',
              alignSelf: 'center',
              '&:hover': {
                borderColor: 'text.primary',
                color: 'text.primary',
                bgcolor: alpha(theme.palette.text.primary, 0.05),
              },
            }}
          >
            {messages.refresh}
          </Button>

        {error && (
          <Alert
            severity="error"
            variant="outlined"
            sx={{ borderRadius: 2 }}
            action={<Button color="inherit" size="small" onClick={() => void load(page)}>{messages.refresh}</Button>}
          >
            {error}
          </Alert>
        )}

        {demo && (
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
            {messages.localDemoNotice}
          </Alert>
        )}

        {!loading && top3.length > 0 && (
          <Box
            component="section"
            aria-label={messages.topThree}
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
                      #{entry.rank} • {rankLabel(entry.rank)}
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 800, color: '#fcd34d', mt: 1.5, fontSize: isFirst ? '1.5rem' : '1.25rem' }}
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
                      {messages.rating}
                    </Typography>
                  </Box>
                </Paper>
              );
            })}
          </Box>
        )}

        <Box component="section">
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.secondary', mb: 2 }}>
            {messages.fullRankings}
            <Box
              component="span"
              sx={{ marginInlineStart: 1, fontSize: '0.875rem', fontWeight: 500, color: 'text.disabled' }}
            >
            {loading ? '…' : messages.playerCount(total)}
            </Box>
          </Typography>

          {loading ? (
            <SkeletonRows />
          ) : error && entries.length === 0 ? null : entries.length === 0 ? (
            <EmptyState icon={<Trophy size={28} />} title={messages.noPlayers} description={messages.emptyDescription} />
          ) : (
            <Stack spacing={1}>
              {entries.map((entry) => {
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
                      '&:hover': { borderColor: isMe ? alpha(theme.palette.primary.main, 0.7) : 'text.disabled' },
                    }}
                  >
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
                        <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'text.disabled' }}>
                          {entry.rank}
                        </Typography>
                      )}
                    </Box>

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

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 600, wordBreak: 'break-word', whiteSpace: 'normal' }}>
                          {entry.username}
                        </Typography>
                        {isMe && (
                          <Chip
                            label={messages.you}
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
                      <Stack direction="row" spacing={1.5} sx={{ mt: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          <Box component="span" sx={{ fontWeight: 700, color: '#10b981' }}>
                            {messages.winsShort(entry.wins)}
                          </Box>
                          <Box component="span" sx={{ mx: 0.5, color: 'text.disabled' }}>/</Box>
                          <Box component="span" sx={{ fontWeight: 700, color: '#f43f5e' }}>
                            {messages.lossesShort(entry.losses)}
                          </Box>
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ display: { xs: 'none', sm: 'block' } }}>
                          {messages.games(entry.gamesPlayed)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WinRateBar value={entry.winRate} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {entry.winRate}%
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    <Box sx={{ textAlign: 'end', flexShrink: 0 }}>
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
                        {messages.rating}
                      </Typography>
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          )}

          {!loading && !error && total > PAGE_SIZE && (
            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Button variant="outlined" disabled={page <= 1} onClick={() => void load(page - 1)}>
                {messages.previousPage}
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                {messages.page(page, totalPages)}
              </Typography>
              <Button variant="outlined" disabled={page >= totalPages} onClick={() => void load(page + 1)}>
                {messages.nextPage}
              </Button>
            </Box>
          )}
        </Box>
        </PageStack>
      </PageContainer>
    </Box>
  );
}
