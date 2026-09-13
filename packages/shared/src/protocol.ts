import type { Color, Difficulty, Move } from './types.js';
import type { SerializedGameState } from './serialization.js';

export interface RoomSnapshot {
  code: string;
  color: Color;
  token: string;
  state: SerializedGameState;
  opponentConnected: boolean;
  vsBot: boolean;
  botDifficulty?: Difficulty;
}

export interface ErrorPayload {
  error: string;
}

export interface CreateRoomRequest {
  playerName?: string;
}

export interface CreateAiRoomRequest {
  color: Color;
  difficulty: Difficulty;
}

export interface JoinRoomRequest {
  code: string;
  token?: string;
  playerName?: string;
}

export interface MakeMoveRequest {
  code: string;
  token: string;
  move: Move;
}

export interface LeaveRoomRequest {
  code: string;
  token: string;
}

export interface RematchRequest {
  code: string;
  token: string;
}

export interface StateUpdatePayload {
  state: SerializedGameState;
  opponentConnected: boolean;
}

export interface PresencePayload {
  color: Color;
  connected: boolean;
}

/** Socket.io event names shared between client and server. */
export const EVENTS = {
  CREATE_ROOM: 'room:create',
  CREATE_AI_ROOM: 'room:create-ai',
  JOIN_ROOM: 'room:join',
  MAKE_MOVE: 'game:move',
  STATE_UPDATE: 'game:state',
  PRESENCE: 'room:presence',
  LEAVE_ROOM: 'room:leave',
  REMATCH: 'game:rematch',
} as const;
