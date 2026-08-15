import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EVENTS,
  deserializeGameState,
  getLegalMoves,
  topOf,
} from '@hive/shared';
import type {
  Axial,
  Color,
  ErrorPayload,
  GameState,
  Insect,
  JoinRoomRequest,
  LeaveRoomRequest,
  Move,
  PresencePayload,
  RoomSnapshot,
  StateUpdatePayload,
} from '@hive/shared';
import { socket } from './socket.js';
import { HomeScreen } from './components/HomeScreen.js';
import { StatusBar } from './components/StatusBar.js';
import { Board } from './components/Board.js';
import { Tray } from './components/Tray.js';
import { RulesModal } from './components/RulesModal.js';
import { GameOverOverlay } from './components/GameOverOverlay.js';

const STORAGE_KEY = 'hive.room';

interface StoredRoom {
  code: string;
  token: string;
  color: Color;
}

type Selection = { type: 'reserve'; insect: Insect } | { type: 'board'; pieceId: string; from: Axial } | null;

function loadStoredRoom(): StoredRoom | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredRoom) : null;
  } catch {
    return null;
  }
}

function saveStoredRoom(room: StoredRoom | null) {
  if (room) localStorage.setItem(STORAGE_KEY, JSON.stringify(room));
  else localStorage.removeItem(STORAGE_KEY);
}

export default function App() {
  const [code, setCode] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [myColor, setMyColor] = useState<Color | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [opponentConnected, setOpponentConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const [showRules, setShowRules] = useState(false);
  const [gameOverDismissed, setGameOverDismissed] = useState(false);

  const attemptedReconnect = useRef(false);

  useEffect(() => {
    function onStateUpdate(payload: StateUpdatePayload) {
      setGameState(deserializeGameState(payload.state));
      setOpponentConnected(payload.opponentConnected);
    }
    function onPresence(payload: PresencePayload) {
      setOpponentConnected(payload.connected);
    }
    socket.on(EVENTS.STATE_UPDATE, onStateUpdate);
    socket.on(EVENTS.PRESENCE, onPresence);
    return () => {
      socket.off(EVENTS.STATE_UPDATE, onStateUpdate);
      socket.off(EVENTS.PRESENCE, onPresence);
    };
  }, []);

  useEffect(() => {
    if (attemptedReconnect.current) return;
    const stored = loadStoredRoom();
    if (!stored) return;
    attemptedReconnect.current = true;
    setBusy(true);
    const req: JoinRoomRequest = { code: stored.code, token: stored.token };
    socket.emit(EVENTS.JOIN_ROOM, req, (res: RoomSnapshot | ErrorPayload) => {
      setBusy(false);
      if ('error' in res) {
        saveStoredRoom(null);
        return;
      }
      setCode(res.code);
      setToken(res.token);
      setMyColor(res.color);
      setGameState(deserializeGameState(res.state));
      setOpponentConnected(res.opponentConnected);
      setGameOverDismissed(false);
      saveStoredRoom({ code: res.code, token: res.token, color: res.color });
    });
  }, []);

  const handleCreate = useCallback(() => {
    setBusy(true);
    setError(null);
    socket.emit(EVENTS.CREATE_ROOM, {}, (res: RoomSnapshot) => {
      setBusy(false);
      setCode(res.code);
      setToken(res.token);
      setMyColor(res.color);
      setGameState(deserializeGameState(res.state));
      setOpponentConnected(res.opponentConnected);
      setGameOverDismissed(false);
      saveStoredRoom({ code: res.code, token: res.token, color: res.color });
    });
  }, []);

  const handleJoin = useCallback((roomCode: string) => {
    setBusy(true);
    setError(null);
    const req: JoinRoomRequest = { code: roomCode.trim().toUpperCase() };
    socket.emit(EVENTS.JOIN_ROOM, req, (res: RoomSnapshot | ErrorPayload) => {
      setBusy(false);
      if ('error' in res) {
        setError(res.error);
        return;
      }
      setCode(res.code);
      setToken(res.token);
      setMyColor(res.color);
      setGameState(deserializeGameState(res.state));
      setOpponentConnected(res.opponentConnected);
      setGameOverDismissed(false);
      saveStoredRoom({ code: res.code, token: res.token, color: res.color });
    });
  }, []);

  const legal = useMemo(() => {
    if (!gameState) return null;
    return getLegalMoves(gameState);
  }, [gameState]);

  const isMyTurn = !!(gameState && myColor && gameState.turn === myColor && gameState.status === 'IN_PROGRESS');

  const sendMove = useCallback(
    (move: Move) => {
      if (!code || !token) return;
      socket.emit(EVENTS.MAKE_MOVE, { code, token, move }, (res: { ok: true } | ErrorPayload) => {
        if ('error' in res) setError(res.error);
      });
      setSelection(null);
    },
    [code, token],
  );

  const handleReserveSelect = useCallback(
    (insect: Insect) => {
      if (!isMyTurn) return;
      setError(null);
      setSelection((prev) => (prev?.type === 'reserve' && prev.insect === insect ? null : { type: 'reserve', insect }));
    },
    [isMyTurn],
  );

  const handlePieceTap = useCallback(
    (pieceId: string, at: Axial) => {
      if (!isMyTurn || !gameState || !myColor) return;
      const piece = topOf(gameState.board, at);
      if (!piece || piece.color !== myColor) return;
      setError(null);
      setSelection((prev) =>
        prev?.type === 'board' && prev.pieceId === pieceId ? null : { type: 'board', pieceId, from: at },
      );
    },
    [isMyTurn, gameState, myColor],
  );

  const handleTargetTap = useCallback(
    (at: Axial) => {
      if (!selection || !myColor || !isMyTurn) return;
      if (selection.type === 'reserve') {
        sendMove({ type: 'place', color: myColor, insect: selection.insect, to: at, pieceId: '' });
      } else {
        sendMove({ type: 'move', color: myColor, pieceId: selection.pieceId, from: selection.from, to: at });
      }
    },
    [selection, myColor, isMyTurn, sendMove],
  );

  const handlePass = useCallback(() => {
    if (!myColor) return;
    sendMove({ type: 'pass', color: myColor });
  }, [myColor, sendMove]);

  const leaveRoom = useCallback(() => {
    if (code && token) {
      const req: LeaveRoomRequest = { code, token };
      socket.emit(EVENTS.LEAVE_ROOM, req, () => {});
    }
    saveStoredRoom(null);
    setCode(null);
    setToken(null);
    setMyColor(null);
    setGameState(null);
    setOpponentConnected(false);
    setSelection(null);
    setError(null);
  }, [code, token]);

  const handleLeave = useCallback(() => {
    // No need to confirm once the game has already ended -- there's nothing left to lose.
    const gameIsOver = gameState?.status !== 'IN_PROGRESS';
    if (!gameIsOver && !window.confirm('Vill du lämna spelet? Rumskoden slutar fungera för dig.')) return;
    leaveRoom();
  }, [gameState, leaveRoom]);

  const handlePlayAgain = useCallback(() => {
    leaveRoom();
    handleCreate();
  }, [leaveRoom, handleCreate]);

  const highlightCells: Axial[] = useMemo(() => {
    if (!legal || !selection || !isMyTurn) return [];
    if (selection.type === 'reserve') {
      return legal.placements.filter((p) => p.insect === selection.insect).map((p) => p.to);
    }
    return legal.movements.filter((m) => m.pieceId === selection.pieceId).map((m) => m.to);
  }, [legal, selection, isMyTurn]);

  if (!code || !gameState || !myColor) {
    return (
      <>
        <HomeScreen onCreate={handleCreate} onJoin={handleJoin} onShowRules={() => setShowRules(true)} busy={busy} error={error} />
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </>
    );
  }

  return (
    <div className="app-screen">
      <StatusBar
        code={code}
        myColor={myColor}
        turn={gameState.turn}
        status={gameState.status}
        opponentConnected={opponentConnected}
        canPass={!!legal?.canPass}
        onPass={handlePass}
        onShowRules={() => setShowRules(true)}
        onLeave={handleLeave}
      />
      {error && (
        <div className="error-toast" onClick={() => setError(null)}>
          {error}
        </div>
      )}
      <Board
        board={gameState.board}
        myColor={myColor}
        status={gameState.status}
        selectedFrom={selection?.type === 'board' ? selection.from : null}
        highlightCells={highlightCells}
        onPieceTap={handlePieceTap}
        onTargetTap={handleTargetTap}
      />
      <Tray
        color={myColor}
        reserves={gameState.reserves[myColor]}
        selectedInsect={selection?.type === 'reserve' ? selection.insect : null}
        disabled={!isMyTurn}
        onSelect={handleReserveSelect}
      />
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      {gameState.status !== 'IN_PROGRESS' && !gameOverDismissed && (
        <GameOverOverlay
          status={gameState.status}
          myColor={myColor}
          onPlayAgain={handlePlayAgain}
          onGoHome={handleLeave}
          onDismiss={() => setGameOverDismissed(true)}
        />
      )}
    </div>
  );
}
