import type { Axial } from './types.js';

export const DIRECTIONS: Axial[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function key(c: Axial): string {
  return `${c.q},${c.r}`;
}

export function parseKey(k: string): Axial {
  const [q, r] = k.split(',').map(Number);
  return { q, r };
}

export function coordEquals(a: Axial, b: Axial): boolean {
  return a.q === b.q && a.r === b.r;
}

export function add(a: Axial, b: Axial): Axial {
  return { q: a.q + b.q, r: a.r + b.r };
}

export function neighbors(c: Axial): Axial[] {
  return DIRECTIONS.map((d) => add(c, d));
}

export function areNeighbors(a: Axial, b: Axial): boolean {
  return DIRECTIONS.some((d) => a.q + d.q === b.q && a.r + d.r === b.r);
}

/**
 * The two hexes that flank the shared edge between two adjacent hexes.
 * Used for the sliding "gate" rule (freedom to move).
 */
export function commonNeighbors(a: Axial, b: Axial): Axial[] {
  const i = DIRECTIONS.findIndex((d) => a.q + d.q === b.q && a.r + d.r === b.r);
  if (i === -1) return [];
  const left = DIRECTIONS[(i + 5) % 6];
  const right = DIRECTIONS[(i + 1) % 6];
  return [add(a, left), add(a, right)];
}
