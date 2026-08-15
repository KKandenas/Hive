export type Color = 'WHITE' | 'BLACK';

export type Insect = 'QUEEN' | 'BEETLE' | 'GRASSHOPPER' | 'SPIDER' | 'ANT';

export const INSECT_COUNTS: Record<Insect, number> = {
  QUEEN: 1,
  BEETLE: 2,
  GRASSHOPPER: 3,
  SPIDER: 2,
  ANT: 3,
};

export const ALL_INSECTS: Insect[] = ['QUEEN', 'BEETLE', 'GRASSHOPPER', 'SPIDER', 'ANT'];

export interface Axial {
  q: number;
  r: number;
}

export interface PieceInstance {
  id: string;
  color: Color;
  insect: Insect;
}

export type Board = Map<string, PieceInstance[]>;

export interface PlaceMove {
  type: 'place';
  color: Color;
  insect: Insect;
  to: Axial;
  pieceId: string;
}

export interface MoveMove {
  type: 'move';
  color: Color;
  pieceId: string;
  from: Axial;
  to: Axial;
}

export interface PassMove {
  type: 'pass';
  color: Color;
}

export type Move = PlaceMove | MoveMove | PassMove;

export type GameStatus = 'IN_PROGRESS' | 'WHITE_WINS' | 'BLACK_WINS' | 'DRAW';

export interface GameState {
  board: Board;
  turn: Color;
  turnNumber: number;
  reserves: Record<Color, Record<Insect, number>>;
  placedCount: Record<Color, number>;
  queenPlaced: Record<Color, boolean>;
  nextPieceIndex: Record<Color, Record<Insect, number>>;
  status: GameStatus;
  history: Move[];
}

export interface PlacementOption {
  insect: Insect;
  to: Axial;
}

export interface MovementOption {
  pieceId: string;
  from: Axial;
  to: Axial;
}

export interface LegalMoves {
  placements: PlacementOption[];
  movements: MovementOption[];
  canPass: boolean;
}
