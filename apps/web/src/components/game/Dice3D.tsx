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
}

const faceRotations: Record<number, string> = {
  1: 'rotateX(0deg) rotateY(0deg)',
  2: 'rotateX(0deg) rotateY(-90deg)',
  3: 'rotateX(-90deg) rotateY(0deg)',
  4: 'rotateX(90deg) rotateY(0deg)',
  5: 'rotateX(0deg) rotateY(90deg)',
  6: 'rotateX(0deg) rotateY(180deg)',
};

const Dot = ({ inverted = false }: { inverted?: boolean }) => (
  <div
    style={{
      width: '20%',
      height: '20%',
      borderRadius: '50%',
      background: inverted ? '#ffffff' : '#0f172a',
      boxShadow: inverted ? 'inset 0 1px 1px rgba(255,255,255,0.4)' : 'inset 0 1px 2px rgba(0,0,0,0.6)',
    }}
  />
);

const Empty = () => <div style={{ width: '20%', height: '20%' }} />;

const DiceFace = ({ num, color }: { num: number; color?: string }) => {
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
        background: color ?? '#ffffff',
        border: `1px solid ${color ? 'rgba(0,0,0,0.1)' : '#e2e8f0'}`,
        borderRadius: '15%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '18%',
        boxShadow: 'inset 0 0 15px rgba(0,0,0,0.1)',
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
          gap: '2px',
          placeItems: 'center',
        }}
      >
        {dots.map((hasDot, i) =>
          hasDot ? <Dot key={i} inverted={!!color} /> : <Empty key={i} />,
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
          <DiceFace num={1} color={color} />
        </div>
        {/* پشت - وجه 6 */}
        <div style={{ position: 'absolute', inset: 0, transform: `rotateY(180deg) translateZ(${size / 2}px)` }}>
          <DiceFace num={6} color={color} />
        </div>
        {/* راست - وجه 2 */}
        <div style={{ position: 'absolute', inset: 0, transform: `rotateY(90deg) translateZ(${size / 2}px)` }}>
          <DiceFace num={2} color={color} />
        </div>
        {/* چپ - وجه 5 */}
        <div style={{ position: 'absolute', inset: 0, transform: `rotateY(-90deg) translateZ(${size / 2}px)` }}>
          <DiceFace num={5} color={color} />
        </div>
        {/* بالا - وجه 3 */}
        <div style={{ position: 'absolute', inset: 0, transform: `rotateX(90deg) translateZ(${size / 2}px)` }}>
          <DiceFace num={3} color={color} />
        </div>
        {/* پایین - وجه 4 */}
        <div style={{ position: 'absolute', inset: 0, transform: `rotateX(-90deg) translateZ(${size / 2}px)` }}>
          <DiceFace num={4} color={color} />
        </div>
      </div>
    </div>
  );
}
