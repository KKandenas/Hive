import { io, type Socket } from 'socket.io-client';

function inferServerUrl(): string {
  const envUrl = import.meta.env.VITE_SERVER_URL;
  if (envUrl) return envUrl;
  const { protocol, hostname, port } = window.location;
  // Vite's dev server runs on 5173; the Hive server runs separately on 3001.
  if (port === '5173') return `${protocol}//${hostname}:3001`;
  return window.location.origin;
}

export const socket: Socket = io(inferServerUrl(), { autoConnect: true });
