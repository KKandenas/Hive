import { describe, expect, it } from 'vitest';
import { getLegalMoves, applyMove } from './engine.js';
import { buildState } from './testUtils.js';

describe('movement rules', () => {
  it('forbids moving any piece before that color\'s queen has been placed', () => {
    const state = buildState(
      [
        { color: 'WHITE', insect: 'ANT', q: 0, r: 0 },
        { color: 'BLACK', insect: 'QUEEN', q: 1, r: 0 },
      ],
      'WHITE',
    );
    expect(state.queenPlaced.WHITE).toBe(false);
    const legal = getLegalMoves(state);
    expect(legal.movements).toHaveLength(0);
  });

  it('enforces the one-hive rule: a piece that would split the hive cannot move', () => {
    // A straight chain: queen(0,0) - ant(1,0) - ant(2,0). The middle ant is the only
    // connector; moving it would split the hive into two pieces.
    const state = buildState(
      [
        { color: 'WHITE', insect: 'QUEEN', q: 0, r: 0 },
        { color: 'WHITE', insect: 'ANT', q: 1, r: 0 },
        { color: 'BLACK', insect: 'ANT', q: 2, r: 0 },
      ],
      'WHITE',
    );
    const legal = getLegalMoves(state);
    const middleAntId = 'WHITE-ANT-1';
    expect(legal.movements.some((m) => m.pieceId === middleAntId)).toBe(false);
  });

  it('allows a piece to move when doing so keeps the hive connected', () => {
    const state = buildState(
      [
        { color: 'WHITE', insect: 'QUEEN', q: 0, r: 0 },
        { color: 'WHITE', insect: 'ANT', q: 1, r: 0 },
        { color: 'BLACK', insect: 'ANT', q: 2, r: 0 },
      ],
      'WHITE',
    );
    const legal = getLegalMoves(state);
    const queenId = 'WHITE-QUEEN-0';
    expect(legal.movements.some((m) => m.pieceId === queenId)).toBe(true);
  });

  it('only allows the top piece of a stack to move (beetle locks the piece beneath it)', () => {
    const state = buildState(
      [
        { color: 'WHITE', insect: 'QUEEN', q: 0, r: 0 },
        { color: 'BLACK', insect: 'QUEEN', q: 2, r: 0 },
        { color: 'BLACK', insect: 'ANT', q: 1, r: 0 },
        { color: 'BLACK', insect: 'BEETLE', q: 1, r: 0 },
      ],
      'BLACK',
    );
    const legal = getLegalMoves(state);
    const lockedAntId = 'BLACK-ANT-2';
    const beetleId = 'BLACK-BEETLE-3';
    expect(legal.movements.some((m) => m.pieceId === lockedAntId)).toBe(false);
    expect(legal.movements.some((m) => m.pieceId === beetleId)).toBe(true);
  });

  it('rejects an illegal move via applyMove', () => {
    const state = buildState(
      [
        { color: 'WHITE', insect: 'QUEEN', q: 0, r: 0 },
        { color: 'WHITE', insect: 'ANT', q: 1, r: 0 },
        { color: 'BLACK', insect: 'ANT', q: 2, r: 0 },
      ],
      'WHITE',
    );
    const result = applyMove(state, {
      type: 'move',
      color: 'WHITE',
      pieceId: 'WHITE-ANT-1',
      from: { q: 1, r: 0 },
      to: { q: 1, r: 1 },
    });
    expect(result.error).toBeDefined();
  });

  it('requires passing when no legal placement or movement exists', () => {
    let state = buildState(
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
    // Empty out black's reserve so no placements are possible either.
    state = { ...state, reserves: { ...state.reserves, BLACK: { QUEEN: 0, BEETLE: 0, GRASSHOPPER: 0, SPIDER: 0, ANT: 0 } } };

    const legal = getLegalMoves(state);
    expect(legal.placements).toHaveLength(0);
    expect(legal.movements).toHaveLength(0);
    expect(legal.canPass).toBe(true);

    const result = applyMove(state, { type: 'pass', color: 'BLACK' });
    expect(result.error).toBeUndefined();
    expect(result.state.turn).toBe('WHITE');
  });

  it('rejects a pass when legal moves are available', () => {
    const state = buildState(
      [
        { color: 'WHITE', insect: 'QUEEN', q: 0, r: 0 },
        { color: 'BLACK', insect: 'QUEEN', q: 1, r: 0 },
      ],
      'WHITE',
    );
    const result = applyMove(state, { type: 'pass', color: 'WHITE' });
    expect(result.error).toBeDefined();
  });
});
