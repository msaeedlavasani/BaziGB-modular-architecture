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

const PIECE_PATHS: Record<string, string[]> = {
  P: [
    'M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z',
  ],
  R: [
    'M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5',
    'M34 14l-3 3H14l-3-3',
    'M31 17v12.5H14V17',
    'M31 29.5l1.5 2.5h-20l1.5-2.5',
    'M11 14h23',
  ],
  N: [
    'M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21',
    'M24 18c.3 1.2.3 2.5 0 3.7',
    'M34 18c.3 1.2.3 2.5 0 3.7',
    'M9.5 25.5A.5.5 0 1 1 9 25a.5.5 0 0 1 .5.5z',
    'M15 15.5c4.5 2 7 8 7 8s2-8 7-8',
  ],
  B: [
    'M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 0 4-2 4H11c-2 0-2-4-2-4zM15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2zM25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  ],
  Q: [
    'M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25l-7-11 2 12z',
    'M9 39h27v-3H9v3zM12 36v-4h21v4H12z',
  ],
  K: [
    'M22.5 11.5V15M19 13H26M22.5 25V15M22.5 25c-9.5 0-9.5 4.5-9.5 7h19c0-2.5 0-7-9.5-7zM9 39h27v-3H9v3zM12 36v-4h21v4H12z',
  ],
};

/**
 * برد شطرنج — بازسازی برد قدیمی (react-chessboard + chess.js) روی state انجین.
 * حرکت‌ها محلی با chess.js اعتبارسنجی می‌شوند (احساس فوری) و سرور/موتور
 * مجدداً اعتبارسنجی و پخش می‌کند. پروموشن با پیکر پیش‌فرض انتخاب می‌شود.
 */
export default function ChessBoard({ state, onMove, disabled = false, orientation = 'w' }: Props) {
  const fen = useMemo(() => stateToFen(state), [state]);
  const promotionEmittedRef = useRef(false);

  const customPieces = useMemo(() => {
    const pieceTypes = ['P', 'N', 'B', 'R', 'Q', 'K'];
    const colors = ['w', 'b'];
    const result: Record<string, any> = {};

    colors.forEach((c) => {
      pieceTypes.forEach((t) => {
        const piece = `${c}${t}`;
        const isWhite = c === 'w';
        const fill = isWhite ? '#EEAC2F' : '#333333';
        const stroke = isWhite ? '#B97F12' : '#1A1A1A';

        result[piece] = ({ squareWidth }: { squareWidth: number }) => (
          <svg width={squareWidth} height={squareWidth} viewBox="0 0 45 45">
            <g
              fill={fill}
              stroke={stroke}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {PIECE_PATHS[t].map((path, i) => (
                <path key={i} d={path} />
              ))}
            </g>
          </svg>
        );
      });
    });
    return result;
  }, []);

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
        customPieces={customPieces}
      />
    </Paper>
  );
}
