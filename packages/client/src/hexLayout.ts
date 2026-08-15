import type { Axial } from '@hive/shared';

export const HEX_SIZE = 42;

/** Flat-top axial-to-pixel conversion. */
export function hexToPixel(a: Axial, size = HEX_SIZE): { x: number; y: number } {
  const x = size * ((3 / 2) * a.q);
  const y = size * ((Math.sqrt(3) / 2) * a.q + Math.sqrt(3) * a.r);
  return { x, y };
}

export function hexCorners(center: { x: number; y: number }, size = HEX_SIZE): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    points.push(`${center.x + size * Math.cos(angle)},${center.y + size * Math.sin(angle)}`);
  }
  return points.join(' ');
}
