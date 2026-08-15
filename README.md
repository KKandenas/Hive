# Hive

A web app implementation of **Hive**, the abstract two-player strategy game
played with hexagonal insect tiles instead of a board. Each player uses their
own phone, tablet, or computer — open the same room in a browser on both
devices and play together over the network.

Pieces: Queen Bee 🐝 (1), Beetle 🪲 (2), Grasshopper 🦗 (3), Spider 🕷️ (2),
Soldier Ant 🐜 (3) per player. All rules from the base game are implemented:
placement order, the forced Queen-by-turn-4 rule, per-insect movement, the
one-hive rule, the freedom-to-move (sliding gate) rule, and win/draw
detection.

## Project layout

This is an npm-workspaces monorepo:

- `packages/shared` — the Hive rules engine (TypeScript, framework-free) and
  the client/server network protocol types. Has its own unit test suite.
- `packages/server` — an Express + Socket.IO server that hosts game rooms and
  is the authoritative referee for every move.
- `packages/client` — a React + Vite web app (mobile-friendly) that renders
  the hex board and talks to the server over Socket.IO.

## Setup

```bash
npm install
```

## Running it (development)

You need the shared package built once (server/client import its compiled
output):

```bash
npm run build -w packages/shared
```

Then, in two terminals:

```bash
npm run dev:server   # starts the API/socket server on port 3001
npm run dev:client    # starts the Vite dev server on port 5173
```

Open `http://localhost:5173` in a browser. On another device on the same
Wi-Fi, use your computer's LAN IP instead of `localhost`, e.g.
`http://192.168.1.23:5173`, and set `VITE_SERVER_URL` before starting the
client dev server if the two devices can't infer the server address
automatically:

```bash
VITE_SERVER_URL=http://192.168.1.23:3001 npm run dev:client
```

## Running it (production-style, single server)

The server can also serve the built client directly, so both players just
open one URL:

```bash
npm run build            # builds shared, server, and client
node packages/server/dist/index.js
```

Then open `http://<host-ip>:3001` on both devices.

## How to play

1. One player taps **Create New Game** and shares the 4-character room code
   with the other player.
2. The other player enters the code and taps **Join Game**.
3. White moves first. On your turn, tap a piece in your tray to place it (the
   board highlights legal cells), or tap one of your pieces already on the
   board to move it (legal destinations are highlighted). Tap a highlighted
   cell to confirm.
4. Pinch or use the +/− buttons to zoom, drag to pan, and tap the ⦿ button to
   re-center the view on the hive.
5. Surround the opponent's Queen Bee on all six sides to win.

Each browser remembers its seat (color) in a room via `localStorage`, so
refreshing the page reconnects you to the same game.

## Testing

```bash
npm test   # runs the shared rules-engine unit test suite (vitest)
```
