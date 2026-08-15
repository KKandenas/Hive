import type { Axial, Color, GameState, Insect } from './types.js';
import { createInitialState } from './engine.js';
import { placeOnTop } from './board.js';
import { computeStatus } from './engine.js';

export interface SeedPiece {
  color: Color;
  insect: Insect;
  q: number;
  r: number;
}

/** Directly builds a GameState with the given pieces already on the board, bypassing turn order. */
export function buildState(pieces: SeedPiece[], turn: Color): GameState {
  let state = createInitialState();
  let board = state.board;
  const placedCount: Record<Color, number> = { WHITE: 0, BLACK: 0 };
  const queenPlaced: Record<Color, boolean> = { WHITE: false, BLACK: false };
  const reserves = {
    WHITE: { ...state.reserves.WHITE },
    BLACK: { ...state.reserves.BLACK },
  };

  pieces.forEach((p, i) => {
    board = placeOnTop(board, { q: p.q, r: p.r }, { id: `${p.color}-${p.insect}-${i}`, color: p.color, insect: p.insect });
    placedCount[p.color] += 1;
    reserves[p.color][p.insect] -= 1;
    if (p.insect === 'QUEEN') queenPlaced[p.color] = true;
  });

  return {
    ...state,
    board,
    turn,
    placedCount,
    queenPlaced,
    reserves,
    status: computeStatus(board),
  };
}

export function coord(q: number, r: number): Axial {
  return { q, r };
}
