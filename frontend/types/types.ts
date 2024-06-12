export type ChatMessage = {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
};

export type ChatRoom = {
  id: string;
  state: "idle" | "occupied";
  participants: string[];
};

export type SocketAuth = {
  sessionId?: string;
  chatRoomId?: string;
  [key: string]: any;
};
