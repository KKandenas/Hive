import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { EVENTS, serializeGameState } from '@hive/shared';
import type {
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

function snapshot(room: Room, color: Color, token: string): RoomSnapshot {
  return {
    code: room.code,
    color,
    token,
    state: serializeGameState(room.state),
    opponentConnected: rooms.opponentConnected(room, color),
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

io.on('connection', (socket) => {
  let joinedCode: string | null = null;

  socket.on(EVENTS.CREATE_ROOM, (_req: CreateRoomRequest, ack: (res: RoomSnapshot) => void) => {
    const { room, color, token } = rooms.createRoom();
    room.seats[color]!.socketId = socket.id;
    socket.join(room.code);
    joinedCode = room.code;
    ack(snapshot(room, color, token));
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
      return;
    }
    ack({ ok: true });
    broadcastState(room);
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
      return;
    }
    ack({ ok: true });
    broadcastState(room);
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
