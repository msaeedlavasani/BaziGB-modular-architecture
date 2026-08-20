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
  K: ['M22.5 2v4m-2-2h4', 'M22.5 16c4 0 6-3 6-7 0-3-2-5-6-5s-6 2-6 5c0 4 2 7 6 7z', 'M14 36l-2-20h21l-2 20H14z', 'M11 39h23v-3H11v3z', 'M12 30c5.5-3 15.5-3 21 0'],
  Q: ['M22.5 5c1 0 1.5.5 1.5 1.5s-.5 1.5-1.5 1.5-1.5-.5-1.5-1.5.5-1.5 1.5-1.5z', 'M12 24c5 0 10 0 15 0l6-13-10 8-1-11-7 11-7-11-1 11-10-8 6 13z', 'M14 36l-1-12h19l-1 12H14z', 'M11 39h23v-3H11v3z'],
  R: ['M12 12v6h21v-6h-3v3h-5v-3h-5v3h-5v-3h-3z', 'M14 18l1 18h15l1-18H14z', 'M11 39h23v-3H11v3z', 'M13 36h19v-3H13v3z'],
  B: ['M22.5 7c1 0 2 1 2 2s-1 2-2 2-2-1-2-2 1-2 2-2z', 'M22.5 11c-4.5 0-7 4-7 8 0 4 3 6 5 9h4c2-3 5-5 5-9 0-4-2.5-8-7-8z', 'M16 28l-1 8h15l-1-8H16z', 'M11 39h23v-3H11v3z', 'M18 18l9 9'],
  N: ['M23 11c-6 0-11 5-11 11 0 4 1 7 3 10-2 2-4 5-4 8h22c0-8-2-12-5-15 2-2 3-5 3-8 0-6-4-6-8-6z', 'M19 20c.6 0 1-.4 1-1s-.4-1-1-1-1 .4-1 1 .4 1 1 1z', 'M15 33s4-2 7-2 7 2 7 2', 'M11 39h23v-3H11v3z'],
  P: ['M22.5 12c-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5 4.5-2 4.5-4.5-2-4.5-4.5-4.5z', 'M16 36c1-3 2-8 2-12s2-6 4.5-6 4.5 2 4.5 6 1 9 2 12H16z', 'M14 39h17v-3H14v3z'],
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
        background: '#2a1408',
        p: { xs: 1, sm: 2 },
        border: '6px solid #3a2110',
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
        customDarkSquareStyle={{ backgroundColor: '#38543f' }}
        customLightSquareStyle={{ backgroundColor: '#F1E6CF' }}
        customNotationStyle={{ fontSize: '11px', fontWeight: 600 }}
        customPieces={customPieces}
      />
    </Paper>
  );
}
