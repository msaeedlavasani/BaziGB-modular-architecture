'use client';

import { useCallback, useMemo, useRef } from 'react';
import { Paper } from '@mui/material';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { stateToFen, squareToIndex } from '@/lib/chess-fen';
import { soundService } from '@/lib/sound-service';
import type { ChessMove, ChessState } from '@bazigb/game-chess';

interface Props {
  state: ChessState;
  onMove: (move: ChessMove) => void;
  disabled?: boolean;
  /** کدام سمت پایین صفحه باشد (پیش‌فرض سفید) */
  orientation?: 'w' | 'b';
}

/**
 * برد شطرنج — بازسازی برد قدیمی (react-chessboard + chess.js) روی state انجین.
 * حرکت‌ها محلی با chess.js اعتبارسنجی می‌شوند (احساس فوری) و سرور/موتور
 * مجدداً اعتبارسنجی و پخش می‌کند. پروموشن با پیکر پیش‌فرض انتخاب می‌شود.
 */
export default function ChessBoard({ state, onMove, disabled = false, orientation = 'w' }: Props) {
  const fen = useMemo(() => stateToFen(state), [state]);
  const promotionEmittedRef = useRef(false);

  const handlePieceDrop = useCallback(
    (sourceSquare: string, targetSquare: string, _piece: string): boolean => {
      if (disabled) return false;

      // بعد از انتخاب پروموشن، react-chessboard دوباره onPieceDrop را صدا می‌زند
      if (promotionEmittedRef.current) {
        promotionEmittedRef.current = false;
        return true;
      }

      // اعتبارسنجی محلی برای بازخورد فوری
      const game = new Chess(fen);
      let result;
      try {
        result = game.move({ from: sourceSquare, to: targetSquare });
      } catch {
        result = null;
      }
      if (!result) return false;

      onMove({
        kind: 'move',
        player: state.turn,
        from: squareToIndex(sourceSquare),
        to: squareToIndex(targetSquare),
      });
      soundService.play(result.captured ? 'capture' : 'move');
      return true;
    },
    [disabled, fen, onMove, state.turn],
  );

  const handlePromotionPieceSelect = useCallback(
    (piece?: string, promoteFromSquare?: string, promoteToSquare?: string): boolean => {
      if (piece && promoteFromSquare && promoteToSquare) {
        promotionEmittedRef.current = true;
        onMove({
          kind: 'move',
          player: state.turn,
          from: squareToIndex(promoteFromSquare),
          to: squareToIndex(promoteToSquare),
          promotion: piece[1].toLowerCase() as 'q' | 'r' | 'b' | 'n',
        });
        const captures = !!new Chess(fen).get(promoteToSquare as never);
        soundService.play(captures ? 'capture' : 'move');
      }
      return true;
    },
    [fen, onMove, state.turn],
  );

  return (
    <Paper
      elevation={24}
      sx={{
        width: '100%',
        maxWidth: 560,
        mx: 'auto',
        borderRadius: 4,
        direction: 'ltr', // برد شطرنج LTR است حتی در صفحهٔ RTL
        background: '#6B4423',
        p: { xs: 1, sm: 1.5 },
        border: '1px solid rgba(245, 158, 11, 0.2)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}
    >
      <Chessboard
        id="bazigb-chess"
        position={fen}
        boardOrientation={orientation === 'b' ? 'black' : 'white'}
        onPieceDrop={handlePieceDrop}
        onPromotionPieceSelect={handlePromotionPieceSelect}
        arePiecesDraggable={!disabled}
        isDraggablePiece={() => !disabled}
        areArrowsAllowed={false}
        dropOffBoardAction="snapback"
        animationDuration={250}
        customBoardStyle={{
          borderRadius: '8px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.55)',
        }}
        customDarkSquareStyle={{ backgroundColor: '#3A2A18' }}
        customLightSquareStyle={{ backgroundColor: '#C9A06A' }}
        customNotationStyle={{ fontSize: '11px', fontWeight: 600 }}
      />
    </Paper>
  );
}
