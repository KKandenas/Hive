import { describe, expect, it } from 'vitest';
import { computeStatus } from './engine.js';
import { buildState } from './testUtils.js';

describe('win / draw detection', () => {
  it('declares the opponent the winner when a queen is fully surrounded', () => {
    const state = buildState(
      [
        { color: 'BLACK', insect: 'QUEEN', q: 0, r: 0 },
        { color: 'WHITE', insect: 'ANT', q: 1, r: 0 },
        { color: 'WHITE', insect: 'ANT', q: 1, r: -1 },
        { color: 'WHITE', insect: 'ANT', q: 0, r: -1 },
        { color: 'WHITE', insect: 'GRASSHOPPER', q: -1, r: 0 },
        { color: 'WHITE', insect: 'GRASSHOPPER', q: -1, r: 1 },
        { color: 'WHITE', insect: 'BEETLE', q: 0, r: 1 },
      ],
      'WHITE',
    );
    expect(computeStatus(state.board)).toBe('WHITE_WINS');
  });

  it('stays in progress when a queen has an open neighbor', () => {
    const state = buildState(
      [
        { color: 'BLACK', insect: 'QUEEN', q: 0, r: 0 },
        { color: 'WHITE', insect: 'ANT', q: 1, r: 0 },
      ],
      'WHITE',
    );
    expect(computeStatus(state.board)).toBe('IN_PROGRESS');
  });

  it('is a draw when both queens are simultaneously surrounded', () => {
    // Two adjacent queens; each queen's other five neighbors are filled in.
    const state = buildState(
      [
        { color: 'WHITE', insect: 'QUEEN', q: 0, r: 0 },
        { color: 'BLACK', insect: 'QUEEN', q: 1, r: 0 },
        // Neighbors of white queen (0,0) excluding (1,0): (1,-1),(0,-1),(-1,0),(-1,1),(0,1)
        { color: 'BLACK', insect: 'ANT', q: 1, r: -1 },
        { color: 'BLACK', insect: 'ANT', q: 0, r: -1 },
        { color: 'BLACK', insect: 'GRASSHOPPER', q: -1, r: 0 },
        { color: 'BLACK', insect: 'GRASSHOPPER', q: -1, r: 1 },
        { color: 'BLACK', insect: 'BEETLE', q: 0, r: 1 },
        // Neighbors of black queen (1,0) excluding (0,0): (2,0),(2,-1),(1,-1)*,(0,1)*,(1,1)
        // (1,-1) and (0,1) already filled above and double as shared neighbors.
        { color: 'WHITE', insect: 'ANT', q: 2, r: 0 },
        { color: 'WHITE', insect: 'BEETLE', q: 2, r: -1 },
        { color: 'WHITE', insect: 'SPIDER', q: 1, r: 1 },
      ],
      'WHITE',
    );
    expect(computeStatus(state.board)).toBe('DRAW');
  });
});
