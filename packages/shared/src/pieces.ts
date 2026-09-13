import type { Axial, Board, Insect } from './types.js';
import { DIRECTIONS, add, commonNeighbors, key, neighbors } from './hex.js';
import { heightAt, occupied } from './board.js';

/**
 * Can a piece slide, at ground level, from `from` to the adjacent empty cell `to`?
 * `board` must already have the moving piece removed from `from`.
 */
export function canSlideOneStep(board: Board, from: Axial, to: Axial): boolean {
  if (occupied(board, to)) return false;
  const [c1, c2] = commonNeighbors(from, to);
  const bothBlocked = occupied(board, c1) && occupied(board, c2);
  if (bothBlocked) return false;
  // Must remain touching the hive (some other occupied neighbor of `to`).
  return neighbors(to).some((n) => occupied(board, n));
}

function queenMoves(board: Board, from: Axial): Axial[] {
  return neighbors(from).filter((n) => canSlideOneStep(board, from, n));
}

function beetleMoves(board: Board, from: Axial): Axial[] {
  const elevation = heightAt(board, from); // board already has the beetle removed
  const results: Axial[] = [];
  for (const n of neighbors(from)) {
    const destHeight = heightAt(board, n);
    if (elevation === 0 && destHeight === 0) {
      if (canSlideOneStep(board, from, n)) results.push(n);
    } else {
      // Climbing onto a stack, moving across stack tops, or climbing down: not
      // gated by the ground-level pinch rule.
      results.push(n);
    }
  }
  return results;
}

function grasshopperMoves(board: Board, from: Axial): Axial[] {
  const results: Axial[] = [];
  for (const dir of DIRECTIONS) {
    let cur = add(from, dir);
    if (!occupied(board, cur)) continue; // must hop over at least one piece
    while (occupied(board, cur)) cur = add(cur, dir);
    results.push(cur);
  }
  return results;
}

function spiderMoves(board: Board, from: Axial): Axial[] {
  const results = new Set<string>();
  const startKey = key(from);

  function dfs(current: Axial, steps: number, visited: Set<string>) {
    if (steps === 3) {
      results.add(key(current));
      return;
    }
    for (const n of neighbors(current)) {
      const nk = key(n);
      if (visited.has(nk)) continue;
      if (!canSlideOneStep(board, current, n)) continue;
      visited.add(nk);
      dfs(n, steps + 1, visited);
      visited.delete(nk);
    }
  }

  dfs(from, 0, new Set([startKey]));
  results.delete(startKey);

  return [...results].map((k) => {
    const [q, r] = k.split(',').map(Number);
    return { q, r };
  });
}

function antMoves(board: Board, from: Axial): Axial[] {
  const startKey = key(from);
  const visited = new Set<string>([startKey]);
  const queue: Axial[] = [from];
  const results: Axial[] = [];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const n of neighbors(cur)) {
      const nk = key(n);
      if (visited.has(nk)) continue;
      if (!canSlideOneStep(board, cur, n)) continue;
      visited.add(nk);
      queue.push(n);
      results.push(n);
    }
  }
  return results;
}

/**
 * Destination cells for a piece of the given insect currently "picked up" from `from`.
 * `board` must already have the moving piece removed from `from`.
 */
export function movesFor(insect: Insect, board: Board, from: Axial): Axial[] {
  switch (insect) {
    case 'QUEEN':
      return queenMoves(board, from);
    case 'BEETLE':
      return beetleMoves(board, from);
    case 'GRASSHOPPER':
      return grasshopperMoves(board, from);
    case 'SPIDER':
      return spiderMoves(board, from);
    case 'ANT':
      return antMoves(board, from);
    default:
      return [];
  }
}
