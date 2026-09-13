import type { Color, Difficulty, GameState, Move } from './types.js';
import { OTHER, applyMove, getLegalMoves } from './engine.js';
import { findQueen, occupied } from './board.js';
import { neighbors } from './hex.js';

const WIN_SCORE = 100000;

function candidateMoves(state: GameState): Move[] {
  const color = state.turn;
  const legal = getLegalMoves(state);
  const moves: Move[] = [];
  for (const p of legal.placements) {
    moves.push({ type: 'place', color, insect: p.insect, to: p.to, pieceId: '' });
  }
  for (const m of legal.movements) {
    moves.push({ type: 'move', color, pieceId: m.pieceId, from: m.from, to: m.to });
  }
  if (moves.length === 0) moves.push({ type: 'pass', color });
  return moves;
}

function openNeighborCount(state: GameState, color: Color): number {
  const at = findQueen(state.board, color);
  if (!at) return 6;
  return neighbors(at).filter((n) => !occupied(state.board, n)).length;
}

/** Higher is better for `botColor`. */
function evaluate(state: GameState, botColor: Color): number {
  if (state.status !== 'IN_PROGRESS') {
    if (state.status === 'DRAW') return -200;
    const botWins = (state.status === 'WHITE_WINS' && botColor === 'WHITE') || (state.status === 'BLACK_WINS' && botColor === 'BLACK');
    return botWins ? WIN_SCORE : -WIN_SCORE;
  }
  const oppOpen = openNeighborCount(state, OTHER[botColor]);
  const ownOpen = openNeighborCount(state, botColor);
  // Reward closing in on the opponent's queen far more than staying safe --
  // an aggressive but not reckless bot.
  return (6 - oppOpen) * 100 - (6 - ownOpen) * 70;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

interface ScoredMove {
  move: Move;
  score: number;
}

function scoreMoves(moves: Move[], state: GameState, botColor: Color): ScoredMove[] {
  return moves
    .map((move) => {
      const result = applyMove(state, move);
      const score = result.error ? -Infinity : evaluate(result.state, botColor);
      return { move, score };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Picks a move for whichever color is currently on turn in `state`.
 * EASY: mostly random, but still takes a free win when handed one.
 * MEDIUM: greedy one-ply lookahead, weighted toward surrounding the
 * opponent's queen while keeping its own queen safe, with a little
 * randomness among near-equal options.
 * HARD: same one-ply scoring to shortlist candidates, then a second ply
 * assuming the opponent plays their own best reply, picking whichever
 * candidate holds up best against that.
 */
export function chooseBotMove(state: GameState, difficulty: Difficulty): Move {
  const botColor = state.turn;
  const moves = candidateMoves(state);
  if (moves.length === 1) return moves[0];

  const scored = scoreMoves(moves, state, botColor);

  if (difficulty === 'EASY') {
    if (scored[0].score >= WIN_SCORE) return scored[0].move;
    return pickRandom(moves);
  }

  if (difficulty === 'MEDIUM') {
    const top = scored[0].score;
    const nearTop = scored.filter((s) => s.score >= top - 15);
    return pickRandom(nearTop).move;
  }

  // HARD
  const shortlist = scored.slice(0, Math.min(6, scored.length));
  let best: ScoredMove | null = null;
  for (const candidate of shortlist) {
    const afterOwnMove = applyMove(state, candidate.move);
    if (afterOwnMove.error) continue;

    let worstCase = candidate.score;
    if (afterOwnMove.state.status === 'IN_PROGRESS') {
      const replies = candidateMoves(afterOwnMove.state);
      let minForBot = Infinity;
      for (const reply of replies) {
        const afterReply = applyMove(afterOwnMove.state, reply);
        if (afterReply.error) continue;
        const ourScore = evaluate(afterReply.state, botColor);
        if (ourScore < minForBot) minForBot = ourScore;
      }
      if (minForBot !== Infinity) worstCase = minForBot;
    }

    if (!best || worstCase > best.score) {
      best = { move: candidate.move, score: worstCase };
    }
  }
  return (best ?? scored[0]).move;
}
