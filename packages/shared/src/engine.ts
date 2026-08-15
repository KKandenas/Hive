import type {
  Axial,
  Board,
  Color,
  GameState,
  Insect,
  LegalMoves,
  Move,
  MovementOption,
  PieceInstance,
  PlacementOption,
} from './types.js';
import { ALL_INSECTS, INSECT_COUNTS } from './types.js';
import { key, neighbors } from './hex.js';
import {
  allOccupiedCells,
  createEmptyBoard,
  findQueen,
  isConnected,
  isSurrounded,
  occupied,
  placeOnTop,
  removeTop,
  topOf,
} from './board.js';
import { movesFor } from './pieces.js';

export const OTHER: Record<Color, Color> = { WHITE: 'BLACK', BLACK: 'WHITE' };

export function createInitialState(): GameState {
  const emptyCounts = (): Record<Insect, number> => {
    const rec = {} as Record<Insect, number>;
    for (const insect of ALL_INSECTS) rec[insect] = INSECT_COUNTS[insect];
    return rec;
  };
  const zeroCounts = (): Record<Insect, number> => {
    const rec = {} as Record<Insect, number>;
    for (const insect of ALL_INSECTS) rec[insect] = 0;
    return rec;
  };
  return {
    board: createEmptyBoard(),
    turn: 'WHITE',
    turnNumber: 1,
    reserves: { WHITE: emptyCounts(), BLACK: emptyCounts() },
    placedCount: { WHITE: 0, BLACK: 0 },
    queenPlaced: { WHITE: false, BLACK: false },
    nextPieceIndex: { WHITE: zeroCounts(), BLACK: zeroCounts() },
    status: 'IN_PROGRESS',
    history: [],
  };
}

/** Candidate empty cells where `color` may legally place a new piece. */
export function placementCells(board: Board, color: Color): Axial[] {
  const occupiedCells = allOccupiedCells(board);
  if (occupiedCells.length === 0) return [{ q: 0, r: 0 }];
  if (occupiedCells.length === 1) return neighbors(occupiedCells[0]);

  const candidates = new Map<string, Axial>();
  for (const cell of occupiedCells) {
    for (const n of neighbors(cell)) {
      if (occupied(board, n)) continue;
      candidates.set(key(n), n);
    }
  }
  const result: Axial[] = [];
  for (const c of candidates.values()) {
    const touchesOpponent = neighbors(c).some((n) => {
      const t = topOf(board, n);
      return t !== undefined && t.color !== color;
    });
    if (!touchesOpponent) result.push(c);
  }
  return result;
}

export function getLegalMoves(state: GameState): LegalMoves {
  const color = state.turn;
  const placements: PlacementOption[] = [];
  const movements: MovementOption[] = [];

  const queenMustBePlaced = state.placedCount[color] === 3 && !state.queenPlaced[color];
  const insectsAvailable: Insect[] = queenMustBePlaced
    ? ['QUEEN']
    : ALL_INSECTS.filter((i) => state.reserves[color][i] > 0);

  if (insectsAvailable.length > 0) {
    const cells = placementCells(state.board, color);
    for (const insect of insectsAvailable) {
      if (state.reserves[color][insect] <= 0) continue;
      for (const to of cells) {
        placements.push({ insect, to });
      }
    }
  }

  if (state.queenPlaced[color]) {
    for (const cellKey of state.board.keys()) {
      const [q, r] = cellKey.split(',').map(Number);
      const from = { q, r };
      const piece = topOf(state.board, from);
      if (!piece || piece.color !== color) continue;
      const { board: lifted } = removeTop(state.board, from);
      if (!isConnected(lifted)) continue; // moving this piece would split the hive
      const destinations = movesFor(piece.insect, lifted, from);
      for (const to of destinations) {
        movements.push({ pieceId: piece.id, from, to });
      }
    }
  }

  return {
    placements,
    movements,
    canPass: placements.length === 0 && movements.length === 0,
  };
}

export function movesEqual(a: Move, b: Move): boolean {
  if (a.type !== b.type || a.color !== b.color) return false;
  if (a.type === 'place' && b.type === 'place') {
    return a.insect === b.insect && a.to.q === b.to.q && a.to.r === b.to.r;
  }
  if (a.type === 'move' && b.type === 'move') {
    return a.pieceId === b.pieceId && a.to.q === b.to.q && a.to.r === b.to.r;
  }
  return a.type === 'pass' && b.type === 'pass';
}

export interface ApplyResult {
  state: GameState;
  error?: string;
}

/** Validates and applies a move against the current legal-move set. Returns a new state. */
export function applyMove(state: GameState, move: Move): ApplyResult {
  if (state.status !== 'IN_PROGRESS') {
    return { state, error: 'Game is already over.' };
  }
  if (move.color !== state.turn) {
    return { state, error: `It is not ${move.color}'s turn.` };
  }

  const legal = getLegalMoves(state);

  if (move.type === 'pass') {
    if (!legal.canPass) return { state, error: 'You have legal moves available; you cannot pass.' };
    return { state: finishTurn(state, move) };
  }

  if (move.type === 'place') {
    const ok = legal.placements.some(
      (p) => p.insect === move.insect && p.to.q === move.to.q && p.to.r === move.to.r,
    );
    if (!ok) return { state, error: 'Illegal placement.' };

    const idx = state.nextPieceIndex[move.color][move.insect] + 1;
    const pieceId = `${move.color}-${move.insect}-${idx}`;
    const piece: PieceInstance = { id: pieceId, color: move.color, insect: move.insect };

    let next = { ...state };
    next.board = placeOnTop(state.board, move.to, piece);
    next.reserves = {
      ...state.reserves,
      [move.color]: { ...state.reserves[move.color], [move.insect]: state.reserves[move.color][move.insect] - 1 },
    };
    next.placedCount = { ...state.placedCount, [move.color]: state.placedCount[move.color] + 1 };
    next.nextPieceIndex = {
      ...state.nextPieceIndex,
      [move.color]: { ...state.nextPieceIndex[move.color], [move.insect]: idx },
    };
    if (move.insect === 'QUEEN') {
      next.queenPlaced = { ...state.queenPlaced, [move.color]: true };
    }
    return { state: finishTurn(next, { ...move, pieceId }) };
  }

  if (move.type === 'move') {
    const ok = legal.movements.some(
      (m) => m.pieceId === move.pieceId && m.to.q === move.to.q && m.to.r === move.to.r,
    );
    if (!ok) return { state, error: 'Illegal move.' };

    const { board: lifted, piece } = removeTop(state.board, move.from);
    if (!piece) return { state, error: 'No piece found to move.' };
    const board = placeOnTop(lifted, move.to, piece);

    const next = { ...state, board };
    return { state: finishTurn(next, move) };
  }

  return { state, error: 'Unknown move type.' };
}

function finishTurn(state: GameState, move: Move): GameState {
  const status = computeStatus(state.board);
  return {
    ...state,
    status,
    turn: OTHER[state.turn],
    turnNumber: state.turnNumber + 1,
    history: [...state.history, move],
  };
}

export function computeStatus(board: Board): GameState['status'] {
  const whiteQueen = findQueen(board, 'WHITE');
  const blackQueen = findQueen(board, 'BLACK');
  const whiteSurrounded = whiteQueen !== undefined && isSurrounded(board, whiteQueen);
  const blackSurrounded = blackQueen !== undefined && isSurrounded(board, blackQueen);
  if (whiteSurrounded && blackSurrounded) return 'DRAW';
  if (whiteSurrounded) return 'BLACK_WINS';
  if (blackSurrounded) return 'WHITE_WINS';
  return 'IN_PROGRESS';
}

