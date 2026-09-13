import { describe, expect, it } from 'vitest';
import { createEmptyBoard, placeOnTop } from './board.js';
import { movesFor, canSlideOneStep } from './pieces.js';
import type { Board, PieceInstance } from './types.js';

const dummy = (id: string): PieceInstance => ({ id, color: 'WHITE', insect: 'ANT' });

function boardWithPiecesAt(coords: Array<[number, number]>): Board {
  let board = createEmptyBoard();
  coords.forEach(([q, r], i) => {
    board = placeOnTop(board, { q, r }, dummy(`p${i}`));
  });
  return board;
}

describe('canSlideOneStep (freedom to move / gate rule)', () => {
  it('blocks the move when both flanking hexes are occupied (the pinch)', () => {
    const board = boardWithPiecesAt([
      [1, 0],
      [0, -1],
    ]);
    expect(canSlideOneStep(board, { q: 0, r: 0 }, { q: 1, r: -1 })).toBe(false);
  });

  it('allows the move when only one flanking hex is occupied', () => {
    const board = boardWithPiecesAt([[1, 0]]);
    expect(canSlideOneStep(board, { q: 0, r: 0 }, { q: 1, r: -1 })).toBe(true);
  });

  it('rejects sliding into empty space that does not touch the hive', () => {
    const board = createEmptyBoard();
    expect(canSlideOneStep(board, { q: 0, r: 0 }, { q: 1, r: 0 })).toBe(false);
  });

  it('rejects sliding onto an occupied cell', () => {
    const board = boardWithPiecesAt([[1, 0]]);
    expect(canSlideOneStep(board, { q: 0, r: 0 }, { q: 1, r: 0 })).toBe(false);
  });
});

describe('grasshopper movement', () => {
  it('jumps over one or more pieces in a straight line and lands in the first gap', () => {
    const board = boardWithPiecesAt([
      [1, 0],
      [2, 0],
    ]);
    const moves = movesFor('GRASSHOPPER', board, { q: 0, r: 0 });
    expect(moves).toContainEqual({ q: 3, r: 0 });
  });

  it('cannot move in a direction with no adjacent piece to hop over', () => {
    const board = boardWithPiecesAt([[1, 0]]);
    const moves = movesFor('GRASSHOPPER', board, { q: 0, r: 0 });
    // Only the (1,0) direction has an adjacent piece to jump.
    expect(moves).toEqual([{ q: 2, r: 0 }]);
  });
});

describe('spider movement', () => {
  it('moves along the hive edge for exactly 3 steps, ending on the far side of a single piece', () => {
    // With only one other piece on the board, both directions around it are
    // forced (only one legal step at each stage) and converge on (0,2).
    const board = boardWithPiecesAt([[0, 1]]);
    const moves = movesFor('SPIDER', board, { q: 0, r: 0 });
    expect(moves).toEqual([{ q: 0, r: 2 }]);
  });
});

describe('ant movement', () => {
  it('slides an unlimited number of steps along the hive perimeter', () => {
    const board = boardWithPiecesAt([[0, 1]]);
    const moves = movesFor('ANT', board, { q: 0, r: 0 });
    const asSet = new Set(moves.map((m) => `${m.q},${m.r}`));
    expect(asSet).toEqual(new Set(['1,0', '1,1', '0,2', '-1,1', '-1,2']));
  });
});

describe('beetle movement', () => {
  it('can climb onto an adjacent occupied cell even when the ground gate is blocked', () => {
    const board = boardWithPiecesAt([
      [1, 0],
      [0, -1],
      [1, -1],
    ]);
    // Ground-level move from (0,0) to (1,-1) would be gate-blocked (both flanks occupied),
    // but climbing on top of the piece already there is allowed regardless.
    const moves = movesFor('BEETLE', board, { q: 0, r: 0 });
    expect(moves).toContainEqual({ q: 1, r: -1 });
  });

  it('applies the ground gate rule when moving ground-to-ground', () => {
    const board = boardWithPiecesAt([
      [1, 0],
      [0, -1],
    ]);
    const moves = movesFor('BEETLE', board, { q: 0, r: 0 });
    expect(moves).not.toContainEqual({ q: 1, r: -1 });
  });

  it('is free to move to any neighbor once elevated (bypassing the gate rule)', () => {
    // heightAt(board, from) === 1 simulates a beetle that was on top of a stack.
    let board = createEmptyBoard();
    board = placeOnTop(board, { q: 0, r: 0 }, dummy('below'));
    board = placeOnTop(board, { q: 1, r: 0 }, dummy('flank1'));
    board = placeOnTop(board, { q: 0, r: -1 }, dummy('flank2'));
    const moves = movesFor('BEETLE', board, { q: 0, r: 0 });
    // Even though ground-level gate would block (1,-1), elevation bypasses it.
    expect(moves).toContainEqual({ q: 1, r: -1 });
  });
});
