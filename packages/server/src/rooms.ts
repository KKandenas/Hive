import { randomUUID } from 'node:crypto';
import { applyMove, createInitialState } from '@hive/shared';
import type { Color, Difficulty, GameState, Move } from '@hive/shared';

interface Seat {
  token: string;
  socketId: string | null;
}

export interface BotInfo {
  color: Color;
  difficulty: Difficulty;
}

export interface Room {
  code: string;
  seats: Record<Color, Seat | null>;
  state: GameState;
  bot: BotInfo | null;
}

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
const OTHER: Record<Color, Color> = { WHITE: 'BLACK', BLACK: 'WHITE' };

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

export class RoomStore {
  private rooms = new Map<string, Room>();

  createRoom(): { room: Room; color: Color; token: string } {
    let code = generateRoomCode();
    while (this.rooms.has(code)) code = generateRoomCode();

    const token = randomUUID();
    const room: Room = {
      code,
      seats: { WHITE: { token, socketId: null }, BLACK: null },
      state: createInitialState(),
      bot: null,
    };
    this.rooms.set(code, room);
    return { room, color: 'WHITE', token };
  }

  /** Creates a single-player room: the human takes `humanColor`, the other color is bot-controlled. */
  createAiRoom(humanColor: Color, difficulty: Difficulty): { room: Room; color: Color; token: string } {
    let code = generateRoomCode();
    while (this.rooms.has(code)) code = generateRoomCode();

    const token = randomUUID();
    const room: Room = {
      code,
      seats: { WHITE: null, BLACK: null },
      state: createInitialState(),
      bot: { color: OTHER[humanColor], difficulty },
    };
    room.seats[humanColor] = { token, socketId: null };
    this.rooms.set(code, room);
    return { room, color: humanColor, token };
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  /**
   * Joins a room. If `token` matches an existing seat, reclaims it (reconnect).
   * Otherwise takes the first open seat. Returns an error string on failure.
   */
  joinRoom(code: string, socketId: string, token?: string): { room: Room; color: Color; token: string } | { error: string } {
    const room = this.getRoom(code);
    if (!room) return { error: `Rummet ${code} hittades inte.` };

    if (token) {
      for (const color of ['WHITE', 'BLACK'] as Color[]) {
        const seat = room.seats[color];
        if (seat && seat.token === token) {
          seat.socketId = socketId;
          return { room, color, token };
        }
      }
    }

    if (room.bot) {
      return { error: 'Det här är ett spel mot AI, det går inte att gå med i.' };
    }

    for (const color of ['WHITE', 'BLACK'] as Color[]) {
      if (!room.seats[color]) {
        const newToken = randomUUID();
        room.seats[color] = { token: newToken, socketId };
        return { room, color, token: newToken };
      }
    }

    return { error: 'Rummet är fullt.' };
  }

  seatForToken(room: Room, token: string): Color | undefined {
    for (const color of ['WHITE', 'BLACK'] as Color[]) {
      if (room.seats[color]?.token === token) return color;
    }
    return undefined;
  }

  disconnectSocket(socketId: string): void {
    for (const room of this.rooms.values()) {
      for (const color of ['WHITE', 'BLACK'] as Color[]) {
        const seat = room.seats[color];
        if (seat && seat.socketId === socketId) seat.socketId = null;
      }
    }
  }

  opponentConnected(room: Room, color: Color): boolean {
    if (room.bot) return true;
    const otherColor: Color = color === 'WHITE' ? 'BLACK' : 'WHITE';
    return room.seats[otherColor]?.socketId != null;
  }

  bothConnected(room: Room): boolean {
    return room.seats.WHITE?.socketId != null && room.seats.BLACK?.socketId != null;
  }

  applyPlayerMove(room: Room, color: Color, move: Move): { error: string } | { room: Room } {
    if (move.color !== color) return { error: 'Färgen på draget matchar inte din plats.' };
    const result = applyMove(room.state, move);
    if (result.error) return { error: result.error };
    room.state = result.state;
    return { room };
  }

  /** Resets the board for a fresh game in the same room, keeping both seats/tokens intact. */
  rematch(room: Room): { error: string } | { room: Room } {
    if (room.state.status === 'IN_PROGRESS') {
      return { error: 'Spelet pågår fortfarande.' };
    }
    room.state = createInitialState();
    return { room };
  }
}
