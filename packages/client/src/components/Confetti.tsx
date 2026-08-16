import { useMemo } from 'react';

const COLORS = ['#d4af37', '#f2ead9', '#7fd1c7', '#e8c468', '#ffffff'];

interface Piece {
  left: number;
  delay: number;
  duration: number;
  rotation: number;
  drift: number;
  color: string;
  size: number;
}

export interface ConfettiProps {
  count?: number;
}

export function Confetti({ count = 70 }: ConfettiProps) {
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.6 + Math.random() * 1.8,
        rotation: Math.random() * 360,
        drift: (Math.random() - 0.5) * 120,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 6,
      })),
    [count],
  );

  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              backgroundColor: p.color,
              width: `${p.size}px`,
              height: `${p.size * 0.4}px`,
              '--rot': `${p.rotation}deg`,
              '--drift': `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
