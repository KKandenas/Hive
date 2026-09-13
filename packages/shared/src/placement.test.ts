import { describe, expect, it } from 'vitest';
import { createInitialState, applyMove, getLegalMoves } from './engine.js';
import type { GameState } from './types.js';

function place(state: GameState, color: 'WHITE' | 'BLACK', insect: any, to: { q: number; r: number }) {
  return applyMove(state, { type: 'place', color, insect, to, pieceId: '' });
}

describe('placement rules', () => {
  it('first move of the game must be at the origin (the only empty-board cell)', () => {
    let state = createInitialState();
    const bad = place(state, 'WHITE', 'ANT', { q: 5, r: 5 });
    expect(bad.error).toBeDefined();

    const good = place(state, 'WHITE', 'ANT', { q: 0, r: 0 });
    expect(good.error).toBeUndefined();
  });

  it("second move (black's first) must touch white's piece, even though it is the opponent", () => {
    let state = createInitialState();
    state = place(state, 'WHITE', 'ANT', { q: 0, r: 0 }).state;

    const farAway = place(state, 'BLACK', 'ANT', { q: 5, r: 5 });
    expect(farAway.error).toBeDefined();

    const adjacent = place(state, 'BLACK', 'ANT', { q: 1, r: 0 });
    expect(adjacent.error).toBeUndefined();
  });

  it('from the third placement onward, a new piece may never touch an opponent piece', () => {
    let state = createInitialState();
    state = place(state, 'WHITE', 'ANT', { q: 0, r: 0 }).state;
    state = place(state, 'BLACK', 'BEETLE', { q: 1, r: 0 }).state;

    const legal = getLegalMoves(state).placements.map((p) => p.to);
    const has = (q: number, r: number) => legal.some((c) => c.q === q && c.r === r);

    // (1,-1) and (0,1) are adjacent to both the white ant and the black beetle -> illegal.
    expect(has(1, -1)).toBe(false);
    expect(has(0, 1)).toBe(false);
    // (0,-1) and (-1,0) only touch the white hive -> legal.
    expect(has(0, -1)).toBe(true);
    expect(has(-1, 0)).toBe(true);
    // Can never place on top of an occupied cell during placement.
    expect(has(1, 0)).toBe(false);
  });

  it('forces the queen to be placed on the 4th placement if not placed earlier', () => {
    let state = createInitialState();
    state = place(state, 'WHITE', 'ANT', { q: 0, r: 0 }).state;
    state = place(state, 'BLACK', 'ANT', { q: 1, r: 0 }).state;
    state = place(state, 'WHITE', 'GRASSHOPPER', { q: -1, r: 0 }).state;
    state = place(state, 'BLACK', 'GRASSHOPPER', { q: 2, r: 0 }).state;
    state = place(state, 'WHITE', 'BEETLE', { q: -2, r: 0 }).state;
    state = place(state, 'BLACK', 'BEETLE', { q: 3, r: 0 }).state;

    expect(state.turn).toBe('WHITE');
    expect(state.placedCount.WHITE).toBe(3);
    expect(state.queenPlaced.WHITE).toBe(false);

    const nonQueen = place(state, 'WHITE', 'SPIDER', { q: -3, r: 0 });
    expect(nonQueen.error).toBeDefined();

    const queen = place(state, 'WHITE', 'QUEEN', { q: -3, r: 0 });
    expect(queen.error).toBeUndefined();
    expect(queen.state.queenPlaced.WHITE).toBe(true);
  });

  it('rejects placing a piece with no reserve remaining', () => {
    let state = createInitialState();
    state = place(state, 'WHITE', 'QUEEN', { q: 0, r: 0 }).state;
    state = place(state, 'BLACK', 'QUEEN', { q: 1, r: 0 }).state;
    const result = place(state, 'WHITE', 'QUEEN', { q: -1, r: 0 });
    expect(result.error).toBeDefined();
  });
});
