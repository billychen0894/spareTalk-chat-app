import { ChatMessage, ChatRoom } from './sockets.interface';

export interface IUserSessionRepository {
  storeUserSessionId(sessionId: string): Promise<void>;
  getUserSessionId(sessionId: string): Promise<string | null | undefined>;
  removeUserSessionId(sessionId: string): Promise<void>;
}

export interface IUserQueueRepository {
  addUserToQueue(userId: string): Promise<void>;
  removeUserAndCleanUp(userId: string): Promise<void>;
  dequeueUser(): Promise<string | null>;
}

export interface IChatRoomRepository {
  createChatRoom(roomId: string, user1: string, user2: string): Promise<void>;
  leaveChatRoomById(roomId: string, socketId: string): Promise<void>;
  getChatRoomById(chatRoomId: string): Promise<ChatRoom | undefined | null>;
  getAllChatRooms(): Promise<ChatRoom[] | undefined | null>;
  storeMessage(chatRoomId: string, chatMessage: ChatMessage): Promise<void>;
  retrieveMessages(chatRoomId: string): Promise<ChatMessage[] | null | undefined>;
  deleteChatRoomMessagesById(chatRoomId: string): Promise<void>;
  getMissedMessages(chatRoomId: string, lastActiveTime: string | null | undefined): Promise<ChatMessage[] | null | undefined>;
  isInactive(key: string, thresholdInSeconds: number): Promise<boolean>;
  setChatRoomActivity(chatRoomId: string, timestamp: string): Promise<void>;
  deleteChatRoomRelatedKeys(chatRoomId: string): Promise<void>;
}

export interface IUserRepository {
  checkUserStatus(sessionId: string): Promise<string | null>;
  setLastActiveTimeBySocketId(socketId: string, lastActiveTime: string): Promise<void>;
  getLastActiveTimeBySocketId(socketId: string): Promise<string | null | undefined>;
  deleteLastActiveTime(key: string, socketId: string): Promise<void>;
  removeUserMessageIds(socketId: string, chatRoomId: string): Promise<void>;
  setUserStatus(user: string): Promise<void>;
  deleteUserRelatedKeys(sessionId: string): Promise<void>;
}

export interface IEventRepository {
  isEventProcessed(eventId: string, eventName: string): Promise<boolean>;
  storeEvent(eventId: string, eventName: string): Promise<void>;
  removeOldEvents(): Promise<void>;
  processSocketEvent(event: string, eventId: string): Promise<boolean>;
}
