import { io, Socket } from 'socket.io-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

export function getSupportSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(`${API_BASE}/support`, {
    auth: { token },
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  return socket;
}

export function disconnectSupportSocket() {
  socket?.disconnect();
  socket = null;
}
