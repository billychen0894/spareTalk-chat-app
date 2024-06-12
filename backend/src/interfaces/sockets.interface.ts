import { Socket } from 'socket.io';

export interface SocketInterface {
  handleConnection(socket: Socket): void;
  middlewareImplementation?(socket: Socket, next: any): void;
}

export interface ChatRoom {
  id: string;
  state: 'idle' | 'occupied';
  participants: string[];
}

export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
}

export interface CustomSocket extends Socket {
  sessionId?: string;
  chatRoomId?: string;
}
