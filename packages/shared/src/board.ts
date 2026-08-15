import type { Axial, Board, Color, Insect, PieceInstance } from './types.js';
import { key, neighbors, parseKey } from './hex.js';

export function createEmptyBoard(): Board {
  return new Map();
}

export function cloneBoard(board: Board): Board {
  const clone: Board = new Map();
  for (const [k, stack] of board) {
    clone.set(k, [...stack]);
  }
  return clone;
}

export function stackAt(board: Board, c: Axial): PieceInstance[] {
  return board.get(key(c)) ?? [];
}

export function heightAt(board: Board, c: Axial): number {
  return stackAt(board, c).length;
}

export function occupied(board: Board, c: Axial): boolean {
  return heightAt(board, c) > 0;
}

export function topOf(board: Board, c: Axial): PieceInstance | undefined {
  const stack = stackAt(board, c);
  return stack.length > 0 ? stack[stack.length - 1] : undefined;
}

export function findCell(board: Board, pieceId: string): Axial | undefined {
  for (const [k, stack] of board) {
    if (stack.some((p) => p.id === pieceId)) return parseKey(k);
  }
  return undefined;
}

export function findQueen(board: Board, color: Color): Axial | undefined {
  for (const [k, stack] of board) {
    if (stack.some((p) => p.color === color && p.insect === 'QUEEN')) return parseKey(k);
  }
  return undefined;
}

export function placeOnTop(board: Board, c: Axial, piece: PieceInstance): Board {
  const next = cloneBoard(board);
  const k = key(c);
  const stack = next.get(k) ?? [];
  next.set(k, [...stack, piece]);
  return next;
}

/** Removes the top piece at cell c, returning the new board and the removed piece. */
export function removeTop(board: Board, c: Axial): { board: Board; piece: PieceInstance | undefined } {
  const next = cloneBoard(board);
  const k = key(c);
  const stack = next.get(k) ?? [];
  if (stack.length === 0) return { board: next, piece: undefined };
  const piece = stack[stack.length - 1];
  const rest = stack.slice(0, -1);
  if (rest.length > 0) next.set(k, rest);
  else next.delete(k);
  return { board: next, piece };
}

export function allOccupiedCells(board: Board): Axial[] {
  const cells: Axial[] = [];
  for (const [k, stack] of board) {
    if (stack.length > 0) cells.push(parseKey(k));
  }
  return cells;
}

export function totalPieceCount(board: Board): number {
  let n = 0;
  for (const stack of board.values()) n += stack.length;
  return n;
}

/** True if all occupied cells form a single connected group (the "one hive" rule). */
export function isConnected(board: Board): boolean {
  const cells = allOccupiedCells(board);
  if (cells.length <= 1) return true;
  const occupiedKeys = new Set(cells.map(key));
  const startKey = key(cells[0]);
  const visited = new Set<string>([startKey]);
  const queue: Axial[] = [cells[0]];
  while (queue.length > 0) {
    const cur = queue.pop()!;
    for (const n of neighbors(cur)) {
      const nk = key(n);
      if (occupiedKeys.has(nk) && !visited.has(nk)) {
        visited.add(nk);
        queue.push(n);
      }
    }
  }
  return visited.size === occupiedKeys.size;
}

export function isSurrounded(board: Board, c: Axial): boolean {
  return neighbors(c).every((n) => occupied(board, n));
}
