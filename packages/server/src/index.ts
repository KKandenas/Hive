import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { EVENTS, applyMove, chooseBotMove, serializeGameState } from '@hive/shared';
import type {
  CreateAiRoomRequest,
  CreateRoomRequest,
  ErrorPayload,
  JoinRoomRequest,
  LeaveRoomRequest,
  MakeMoveRequest,
  RematchRequest,
  RoomSnapshot,
  StateUpdatePayload,
} from '@hive/shared';
import { RoomStore, type Room } from './rooms.js';
import type { Color } from '@hive/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');

const app = express();
app.use(cors());
app.use(express.static(CLIENT_DIST));

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const rooms = new RoomStore();
const pendingBotMoves = new Map<string, NodeJS.Timeout>();

function snapshot(room: Room, color: Color, token: string): RoomSnapshot {
  return {
    code: room.code,
    color,
    token,
    state: serializeGameState(room.state),
    opponentConnected: rooms.opponentConnected(room, color),
    vsBot: room.bot !== null,
    botDifficulty: room.bot?.difficulty,
  };
}

function broadcastState(room: Room): void {
  for (const color of ['WHITE', 'BLACK'] as Color[]) {
    const seat = room.seats[color];
    if (!seat?.socketId) continue;
    const payload: StateUpdatePayload = {
      state: serializeGameState(room.state),
      opponentConnected: rooms.opponentConnected(room, color),
    };
    io.to(seat.socketId).emit(EVENTS.STATE_UPDATE, payload);
  }
}

/** Pushes the room's current authoritative state to a single socket. Used to self-heal a
 * client whose local view has drifted (e.g. it missed a broadcast after a reconnect) --
 * without this, a rejected move for that reason would just keep failing forever. */
function sendStateTo(socket: { id: string }, room: Room, color: Color): void {
  const payload: StateUpdatePayload = {
    state: serializeGameState(room.state),
    opponentConnected: rooms.opponentConnected(room, color),
  };
  io.to(socket.id).emit(EVENTS.STATE_UPDATE, payload);
}

function broadcastPresence(room: Room): void {
  for (const color of ['WHITE', 'BLACK'] as Color[]) {
    const seat = room.seats[color];
    if (!seat?.socketId) continue;
    io.to(seat.socketId).emit(EVENTS.PRESENCE, {
      color: color === 'WHITE' ? 'BLACK' : 'WHITE',
      connected: rooms.opponentConnected(room, color),
    });
  }
}

/** If it's the bot's turn, plays its move after a short "thinking" delay. */
function scheduleBotMoveIfNeeded(room: Room): void {
  const existing = pendingBotMoves.get(room.code);
  if (existing) clearTimeout(existing);

  if (!room.bot || room.state.status !== 'IN_PROGRESS' || room.state.turn !== room.bot.color) {
    return;
  }

  const delay = 500 + Math.random() * 700;
  const timer = setTimeout(() => {
    pendingBotMoves.delete(room.code);
    if (!room.bot || room.state.status !== 'IN_PROGRESS' || room.state.turn !== room.bot.color) return;
    const move = chooseBotMove(room.state, room.bot.difficulty);
    const result = applyMove(room.state, move);
    if (result.error) {
      console.error(`Bot produced an illegal move in room ${room.code}:`, move, result.error);
      return;
    }
    room.state = result.state;
    broadcastState(room);
    scheduleBotMoveIfNeeded(room);
  }, delay);
  pendingBotMoves.set(room.code, timer);
}

io.on('connection', (socket) => {
  let joinedCode: string | null = null;

  socket.on(EVENTS.CREATE_ROOM, (_req: CreateRoomRequest, ack: (res: RoomSnapshot) => void) => {
    const { room, color, token } = rooms.createRoom();
    room.seats[color]!.socketId = socket.id;
    socket.join(room.code);
    joinedCode = room.code;
    ack(snapshot(room, color, token));
  });

  socket.on(EVENTS.CREATE_AI_ROOM, (req: CreateAiRoomRequest, ack: (res: RoomSnapshot) => void) => {
    const { room, color, token } = rooms.createAiRoom(req.color, req.difficulty);
    room.seats[color]!.socketId = socket.id;
    socket.join(room.code);
    joinedCode = room.code;
    ack(snapshot(room, color, token));
    scheduleBotMoveIfNeeded(room);
  });

  socket.on(EVENTS.JOIN_ROOM, (req: JoinRoomRequest, ack: (res: RoomSnapshot | ErrorPayload) => void) => {
    const result = rooms.joinRoom(req.code, socket.id, req.token);
    if ('error' in result) {
      ack({ error: result.error });
      return;
    }
    const { room, color, token } = result;
    socket.join(room.code);
    joinedCode = room.code;
    ack(snapshot(room, color, token));
    broadcastPresence(room);
  });

  socket.on(EVENTS.MAKE_MOVE, (req: MakeMoveRequest, ack: (res: { ok: true } | ErrorPayload) => void) => {
    const room = rooms.getRoom(req.code);
    if (!room) {
      ack({ error: 'Rummet hittades inte.' });
      return;
    }
    const color = rooms.seatForToken(room, req.token);
    if (!color) {
      ack({ error: 'Du är inte en registrerad spelare i det här rummet.' });
      return;
    }
    const result = rooms.applyPlayerMove(room, color, req.move);
    if ('error' in result) {
      ack({ error: result.error });
      // The client's local board may have drifted from the server's (e.g. it missed a
      // broadcast after a reconnect); resync it so a stale view doesn't keep rejecting.
      sendStateTo(socket, room, color);
      return;
    }
    ack({ ok: true });
    broadcastState(room);
    scheduleBotMoveIfNeeded(room);
  });

  socket.on(EVENTS.REMATCH, (req: RematchRequest, ack: (res: { ok: true } | ErrorPayload) => void) => {
    const room = rooms.getRoom(req.code);
    if (!room) {
      ack({ error: 'Rummet hittades inte.' });
      return;
    }
    const color = rooms.seatForToken(room, req.token);
    if (!color) {
      ack({ error: 'Du är inte en registrerad spelare i det här rummet.' });
      return;
    }
    const result = rooms.rematch(room);
    if ('error' in result) {
      ack({ error: result.error });
      sendStateTo(socket, room, color);
      return;
    }
    ack({ ok: true });
    broadcastState(room);
    scheduleBotMoveIfNeeded(room);
  });

  socket.on(EVENTS.LEAVE_ROOM, (req: LeaveRoomRequest, ack: (res: { ok: true } | ErrorPayload) => void) => {
    const room = rooms.getRoom(req.code);
    if (!room) {
      ack({ error: 'Rummet hittades inte.' });
      return;
    }
    const color = rooms.seatForToken(room, req.token);
    if (!color) {
      ack({ error: 'Du är inte en registrerad spelare i det här rummet.' });
      return;
    }
    const seat = room.seats[color];
    if (seat) seat.socketId = null;
    socket.leave(room.code);
    if (joinedCode === room.code) joinedCode = null;
    ack({ ok: true });
    broadcastPresence(room);
  });

  socket.on('disconnect', () => {
    rooms.disconnectSocket(socket.id);
    if (joinedCode) {
      const room = rooms.getRoom(joinedCode);
      if (room) broadcastPresence(room);
    }
  });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(CLIENT_DIST, 'index.html'));
});

httpServer.listen(PORT, () => {
  console.log(`Hive server listening on port ${PORT}`);
});
