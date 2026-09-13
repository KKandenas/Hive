import type { Board, GameState, PieceInstance } from './types.js';

export type SerializedBoard = Array<[string, PieceInstance[]]>;

export interface SerializedGameState extends Omit<GameState, 'board'> {
  board: SerializedBoard;
}

export function serializeGameState(state: GameState): SerializedGameState {
  return { ...state, board: Array.from(state.board.entries()) };
}

export function deserializeGameState(serialized: SerializedGameState): GameState {
  const board: Board = new Map(serialized.board);
  return { ...serialized, board };
}
