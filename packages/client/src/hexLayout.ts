import type { Axial } from '@hive/shared';

export const HEX_SIZE = 42;

/**
 * Pointy-top axial-to-pixel conversion (flat left/right edges, points up/down) —
 * matches the orientation of the tile artwork.
 */
export function hexToPixel(a: Axial, size = HEX_SIZE): { x: number; y: number } {
  const x = size * (Math.sqrt(3) * a.q + (Math.sqrt(3) / 2) * a.r);
  const y = size * ((3 / 2) * a.r);
  return { x, y };
}

export function hexCorners(center: { x: number; y: number }, size = HEX_SIZE): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    points.push(`${center.x + size * Math.cos(angle)},${center.y + size * Math.sin(angle)}`);
  }
  return points.join(' ');
}
