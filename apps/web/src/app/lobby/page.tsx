'use client';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import GameCard from '@/components/shared/GameCard';
import GameIdentityMark from '@/components/game/GameIdentityMark';
import PageContainer from '@/components/layout/PageContainer';
import PageStack from '@/components/layout/PageStack';
import PageHeader from '@/components/layout/PageHeader';
import ResponsiveGrid from '@/components/layout/ResponsiveGrid';
import { useAppLocale } from '@/hooks/useAppLocale';
import { getMessages } from '@/i18n/messages';
import { localizedGameHubRoute } from '@/i18n/routing';
import { WEB_GAME_IDS, getGameTitle } from '@/lib/game-catalog';

export default function LobbyPage() {
  const locale = useAppLocale();
  const messages = getMessages(locale);

  return (
    <Box sx={{ flex: 1, bgcolor: 'background.default', color: 'text.primary' }}>
      <PageContainer width="wide">
        <PageStack>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Chip label={messages.lobby.alphaNotice} color="info" size="small" variant="outlined" />
          <PageHeader title={messages.lobby.title} description={messages.lobby.subtitle} />
        </Box>
        <Box component="section" aria-label={messages.lobby.chooseGame}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 900, textAlign: 'center' }}>
            {messages.lobby.chooseGame}
          </Typography>
          <ResponsiveGrid itemSize="compact">
            {WEB_GAME_IDS.map((gameId) => {
              return <GameCard key={gameId} title={getGameTitle(gameId, locale)} icon={<GameIdentityMark gameId={gameId} />} href={localizedGameHubRoute(locale, gameId)} />;
            })}
          </ResponsiveGrid>
        </Box>
        </PageStack>
      </PageContainer>
    </Box>
  );
}
