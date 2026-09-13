import { describe, expect, it } from 'vitest';
import { chooseBotMove } from './bot.js';
import { applyMove, getLegalMoves } from './engine.js';
import { buildState } from './testUtils.js';
import type { Difficulty, GameState } from './types.js';

const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

function winningMoveState(): GameState {
  // Black queen at (0,0) has five of six neighbors filled; (0,1) is the last
  // gap, reachable by White's queen at (1,1) in one legal slide.
  return buildState(
    [
      { color: 'BLACK', insect: 'QUEEN', q: 0, r: 0 },
      { color: 'BLACK', insect: 'ANT', q: 1, r: 0 },
      { color: 'WHITE', insect: 'ANT', q: 1, r: -1 },
      { color: 'WHITE', insect: 'GRASSHOPPER', q: 0, r: -1 },
      { color: 'WHITE', insect: 'BEETLE', q: -1, r: 0 },
      { color: 'WHITE', insect: 'SPIDER', q: -1, r: 1 },
      { color: 'WHITE', insect: 'QUEEN', q: 1, r: 1 },
    ],
    'WHITE',
  );
}

describe('chooseBotMove', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`(${difficulty}) always returns a legal move during placement`, () => {
      const state = buildState([{ color: 'WHITE', insect: 'ANT', q: 0, r: 0 }], 'BLACK');
      const move = chooseBotMove(state, difficulty);
      const result = applyMove(state, move);
      expect(result.error).toBeUndefined();
    });

    it(`(${difficulty}) always returns a legal move once both queens are on the board`, () => {
      const state = buildState(
        [
          { color: 'WHITE', insect: 'QUEEN', q: 0, r: 0 },
          { color: 'WHITE', insect: 'ANT', q: 1, r: 0 },
          { color: 'BLACK', insect: 'QUEEN', q: 2, r: 0 },
          { color: 'BLACK', insect: 'ANT', q: 3, r: 0 },
        ],
        'WHITE',
      );
      const move = chooseBotMove(state, difficulty);
      const result = applyMove(state, move);
      expect(result.error).toBeUndefined();
    });

    it(`(${difficulty}) takes a move that immediately wins the game`, () => {
      const state = winningMoveState();
      const move = chooseBotMove(state, difficulty);
      const result = applyMove(state, move);
      expect(result.error).toBeUndefined();
      expect(result.state.status).toBe('WHITE_WINS');
    });

    it(`(${difficulty}) passes when no placement or movement is legal`, () => {
      const state = buildState(
        [
          { color: 'BLACK', insect: 'QUEEN', q: 0, r: 0 },
          { color: 'WHITE', insect: 'ANT', q: 1, r: 0 },
          { color: 'WHITE', insect: 'ANT', q: 0, r: 1 },
          { color: 'WHITE', insect: 'ANT', q: -1, r: 1 },
          { color: 'WHITE', insect: 'GRASSHOPPER', q: -1, r: 0 },
          { color: 'WHITE', insect: 'GRASSHOPPER', q: 0, r: -1 },
        ],
        'BLACK',
      );
      const noReserve = {
        ...state,
        reserves: { ...state.reserves, BLACK: { QUEEN: 0, BEETLE: 0, GRASSHOPPER: 0, SPIDER: 0, ANT: 0 } },
      };
      expect(getLegalMoves(noReserve).canPass).toBe(true);
      const move = chooseBotMove(noReserve, difficulty);
      expect(move.type).toBe('pass');
    });
  }
});
