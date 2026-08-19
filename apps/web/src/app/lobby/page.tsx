'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import GridOnIcon from '@mui/icons-material/GridOn';
import CasinoIcon from '@mui/icons-material/Casino';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import type { GameId } from '@bazigb/engine';
import GameCard from '@/components/shared/GameCard';
import { createRoom } from '@/lib/api';

interface GameMeta {
  id: GameId;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const GAMES: GameMeta[] = [
  { id: 'tic-tac-toe', title: 'دوز', description: 'بازی کلاسیک سه‌دریک‌ردیفی با هوش مصنوعی قوی و قوانین مسابقه', icon: <GridOnIcon fontSize="inherit" /> },
  { id: 'backgammon', title: 'نرد', description: 'تخته‌نرد حرفه‌ای با حرکات ترکیبی و ضربه‌های زندان', icon: <CasinoIcon fontSize="inherit" /> },
  { id: 'chess', title: 'شطرنج', description: 'شطرنج کامل با کیش‌مات، قلعه و آن‌پاسان', icon: <span style={{ fontSize: 34 }}>♞</span> },
  { id: 'vegas', title: 'وگاس', description: 'بازی تاس و شرط‌بندی با پات و استراتژی مارتینگل', icon: <LocalFireDepartmentIcon fontSize="inherit" /> },
];

export default function Lobby() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const playLocal = (id: GameId) => router.push(`/game/${id}`);

  const playOnline = async (id: GameId) => {
    try {
      const room = await createRoom(id);
      router.push(`/game/${id}?room=${room.id}`);
    } catch {
      setError('سرور در دسترس نیست — بازی محلی را انتخاب کنید');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', minWidth: 0 }}>
      <Box>
        <Typography variant="h4" sx={{ color: 'text.primary' }}>
          لابی بازی‌ها
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          یک بازی را انتخاب کنید — محلی (با ربات) یا آنلاین (اتاق سرور)
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {GAMES.map((game) => (
          <Grid item key={game.id} xs={12} sm={6} md={3} sx={{ minWidth: 0 }}>
            <GameCard
              title={game.title}
              description={game.description}
              icon={game.icon}
              onClick={() => playLocal(game.id)}
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button size="small" fullWidth variant="contained" color="primary" onClick={() => playLocal(game.id)}>
                بازی با ربات
              </Button>
              <Button size="small" fullWidth variant="outlined" color="primary" onClick={() => playOnline(game.id)}>
                اتاق آنلاین
              </Button>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
