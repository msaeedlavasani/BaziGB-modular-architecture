'use client';

import React from 'react';

/**
 * Dice3D — تاس سه‌بعدی قابل استفاده مجدد برای BaziGB.
 * چیدمان استاندارد: ۱ در مقابل ۶، ۲ در مقابل ۵، ۳ در مقابل ۴.
 * (پورت از نسخه قدیمی با استایل inline — بدون Tailwind)
 */

interface Dice3DProps {
  value: number; // 1..6
  rolling?: boolean; // true → انیمیشن چرخش
  size?: number; // px, پیش‌فرض 48
  color?: string; // رنگ اختیاری وجه‌ها
  className?: string;
  mode?: 'dice' | 'cube';
}

const faceRotations: Record<number, string> = {
  1: 'rotateX(0deg) rotateY(0deg)',
  2: 'rotateX(0deg) rotateY(-90deg)',
  3: 'rotateX(-90deg) rotateY(0deg)',
  4: 'rotateX(90deg) rotateY(0deg)',
  5: 'rotateX(0deg) rotateY(90deg)',
  6: 'rotateX(0deg) rotateY(180deg)',
};

const getDotColor = (faceColor?: string) => {
  if (!faceColor) return '#4A2912'; // Bronze
  const hex = faceColor.replace('#', '');
  const fullHex = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 165 ? '#4A2912' : '#F5EFE4';
};

const Dot = ({ color }: { color: string }) => (
  <div
    style={{
      width: '32%',
      height: '32%',
      borderRadius: '50%',
      background: color,
      boxShadow: 'inset 0 1px 1px rgba(0,0,0,0.25)',
    }}
  />
);

const Empty = () => <div style={{ width: '32%', height: '32%' }} />;

const CUBE_VALUES = [2, 4, 8, 16, 32, 64];

const DiceFace = ({
  num,
  color,
  mode = 'dice',
}: {
  num: number;
  color?: string;
  mode?: 'dice' | 'cube';
}) => {
  const dotColor = getDotColor(color);

  if (mode === 'cube') {
    const displayValue = CUBE_VALUES[num - 1] || 2;
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          background: color ?? 'linear-gradient(145deg, #F7E9C9 0%, #E9CD93 100%)',
          border: `1px solid ${color ? 'rgba(0,0,0,0.1)' : 'rgba(107, 63, 30, 0.35)'}`,
          borderRadius: '20%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: color ? 'inset 0 0 15px rgba(0,0,0,0.1)' : 'inset 0 0 12px rgba(107, 63, 30, 0.15)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <span
          style={{
            color: dotColor,
            fontWeight: 'bold',
            fontSize: '40%',
            fontFamily:
              'Vazirmatn, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            textAlign: 'center',
            lineHeight: 1,
          }}
        >
          {displayValue}
        </span>
      </div>
    );
  }

  // شبکه 3x3: شاخص‌ها 0..8
  const dots = Array(9).fill(false);
  switch (num) {
    case 1:
      dots[4] = true;
      break;
    case 2:
      dots[2] = dots[6] = true;
      break;
    case 3:
      dots[2] = dots[4] = dots[6] = true;
      break;
    case 4:
      dots[0] = dots[2] = dots[6] = dots[8] = true;
      break;
    case 5:
      dots[0] = dots[2] = dots[4] = dots[6] = dots[8] = true;
      break;
    case 6:
      dots[0] = dots[2] = dots[3] = dots[5] = dots[6] = dots[8] = true;
      break;
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        background: color ?? 'linear-gradient(145deg, #F7E9C9 0%, #E9CD93 100%)',
        border: `1px solid ${color ? 'rgba(0,0,0,0.1)' : 'rgba(107, 63, 30, 0.35)'}`,
        borderRadius: '20%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8%',
        boxShadow: color ? 'inset 0 0 15px rgba(0,0,0,0.1)' : 'inset 0 0 12px rgba(107, 63, 30, 0.15)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          width: '100%',
          height: '100%',
          gap: 0,
          placeItems: 'center',
        }}
      >
        {dots.map((hasDot, i) =>
          hasDot ? <Dot key={i} color={dotColor} /> : <Empty key={i} />,
        )}
      </div>
    </div>
  );
};

export default function Dice3D({
  value,
  rolling = false,
  size = 48,
  color,
  className = '',
  mode = 'dice',
}: Dice3DProps): JSX.Element {
  const rotation = faceRotations[value] || faceRotations[1];

  return (
    <div
      className={`dice3d-root ${className}`}
      style={{
        position: 'relative',
        width: size,
        height: size,
        perspective: `${size * 4}px`,
        transition: 'transform 0.2s ease',
        cursor: 'default',
      }}
    >
      <style>{`
        @keyframes dice-rolling-keyframes {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          20% { transform: rotateX(180deg) rotateY(90deg) rotateZ(45deg); }
          40% { transform: rotateX(360deg) rotateY(180deg) rotateZ(90deg); }
          60% { transform: rotateX(540deg) rotateY(270deg) rotateZ(135deg); }
          80% { transform: rotateX(720deg) rotateY(360deg) rotateZ(180deg); }
          100% { transform: rotateX(900deg) rotateY(450deg) rotateZ(225deg); }
        }
        .dice3d-root:hover { transform: scale(1.1); }
        .dice-3d-container {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.3, 1.1);
        }
        .dice-3d-rolling {
          animation: dice-rolling-keyframes 0.6s linear infinite;
          transition: none;
        }
      `}</style>

      <div
        className={`dice-3d-container ${rolling ? 'dice-3d-rolling' : ''}`}
        style={{ transform: rolling ? undefined : rotation }}
      >
        {/* جلو - وجه 1 */}
        <div style={{ position: 'absolute', inset: 0, transform: `translateZ(${size / 2}px)` }}>
          <DiceFace num={1} color={color} mode={mode} />
        </div>
        {/* پشت - وجه 6 */}
        <div style={{ position: 'absolute', inset: 0, transform: `rotateY(180deg) translateZ(${size / 2}px)` }}>
          <DiceFace num={6} color={color} mode={mode} />
        </div>
        {/* راست - وجه 2 */}
        <div style={{ position: 'absolute', inset: 0, transform: `rotateY(90deg) translateZ(${size / 2}px)` }}>
          <DiceFace num={2} color={color} mode={mode} />
        </div>
        {/* چپ - وجه 5 */}
        <div style={{ position: 'absolute', inset: 0, transform: `rotateY(-90deg) translateZ(${size / 2}px)` }}>
          <DiceFace num={5} color={color} mode={mode} />
        </div>
        {/* بالا - وجه 3 */}
        <div style={{ position: 'absolute', inset: 0, transform: `rotateX(90deg) translateZ(${size / 2}px)` }}>
          <DiceFace num={3} color={color} mode={mode} />
        </div>
        {/* پایین - وجه 4 */}
        <div style={{ position: 'absolute', inset: 0, transform: `rotateX(-90deg) translateZ(${size / 2}px)` }}>
          <DiceFace num={4} color={color} mode={mode} />
        </div>
      </div>
    </div>
  );
}
