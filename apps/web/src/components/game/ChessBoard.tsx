'use client';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { getLegalMoves, type ChessMove, type ChessState } from '@bazigb/game-chess';

/** گلیف مهره‌ها: [سفید، سیاه] */
const GLYPHS: Record<string, [string, string]> = {
  p: ['♙', '♟'],
  r: ['♖', '♜'],
  n: ['♘', '♞'],
  b: ['♗', '♝'],
  q: ['♕', '♛'],
  k: ['♔', '♚'],
};

interface Props {
  state: ChessState;
  onMove: (move: ChessMove) => void;
  disabled?: boolean;
}

/** برد شطرنج — چوب و عاج با خانه‌های سایه‌دار */
export default function ChessBoard({ state, onMove, disabled }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  const myColor = state.players[0]?.color as 'white' | 'black';
  const legal = selected !== null ? getLegalMoves(state).filter((m) => m.from === selected) : [];
  const targets = new Set(legal.map((m) => m.to));

  const handleSquare = (index: number) => {
    if (disabled) return;
    const cell = state.board[index];
    const piece = cell ? GLYPHS[cell.type][cell.color === 'white' ? 0 : 1] : null;

    // انتخاب مهره خودی
    if (cell && cell.color === myColor && (!selected || selected !== index)) {
      setSelected(index);
      return;
    }
    // حرکت به هدف
    if (selected !== null && targets.has(index)) {
      const move = legal.find((m) => m.to === index)!;
      onMove(move);
      setSelected(null);
      return;
    }
    setSelected(null);
    void piece;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%', minWidth: 0 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          width: 'min(100%, 480px)',
          borderRadius: 2,
          overflow: 'hidden',
          border: '3px solid #5A4126',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        }}
      >
        {state.board.map((cell, i) => {
          const row = Math.floor(i / 8);
          const col = i % 8;
          const dark = (row + col) % 2 === 1;
          const isSelected = selected === i;
          const isTarget = targets.has(i);
          const glyph = cell ? GLYPHS[cell.type][cell.color === 'white' ? 0 : 1] : null;
          return (
            <Box
              key={i}
              onClick={() => handleSquare(i)}
              sx={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: { xs: 22, sm: 34 },
                cursor: disabled ? 'default' : 'pointer',
                background: dark
                  ? 'linear-gradient(180deg, #3A2A18 0%, #241708 100%)'
                  : 'linear-gradient(180deg, #C9A06A 0%, #A87F4C 100%)',
                boxShadow: isSelected ? 'inset 0 0 0 3px #EEAC2F, 0 0 14px rgba(238,172,47,0.6)' : 'inset 0 2px 4px rgba(0,0,0,0.35)',
                color: cell ? (cell.color === 'white' ? '#F5EFE4' : '#0B1622') : 'transparent',
                textShadow: cell && cell.color === 'white' ? '0 1px 2px rgba(0,0,0,0.6)' : '0 1px 1px rgba(238,172,47,0.35)',
              }}
            >
              {isTarget && !glyph ? <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: 'rgba(238,172,47,0.7)' }} /> : glyph}
            </Box>
          );
        })}
      </Box>

      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        نوبت: {state.turn === state.players[0]?.id ? 'شما' : 'ربات'}
        {state.phase === 'finished' &&
          (state.winner ? ` — ${state.winner === state.players[0]?.id ? '🎉 شما برنده شدید!' : 'ربات برنده شد'}` : ' — پات!')}
      </Typography>
    </Box>
  );
}
