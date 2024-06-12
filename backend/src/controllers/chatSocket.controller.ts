import { BaseError } from '@/exceptions/baseError';
import { RedisError, ResourceNotFoundError } from '@/exceptions/customErrors';
import { ChatMessage, CustomSocket, SocketInterface } from '@/interfaces/sockets.interface';
import { ChatService } from '@/services/chat.service';
import { Server as IOServer } from 'socket.io';

export class ChatSocket implements SocketInterface {
  constructor(
    private chatService: ChatService,
    private io: IOServer,
  ) {
    // check inactivity of chatRooms in every one hour
    setInterval(
      () => {
        this.safeDeleteChatRooms().catch(console.error);
      },
      60 * 60 * 1000,
    );
  }

  public async handleConnection(socket: CustomSocket): Promise<void> {
    socket.emit('session', { sessionId: socket.sessionId, chatRoomId: socket.chatRoomId });

    this.registerEventHandlers(socket);

    socket.onAny((eventName, ...args) => {
      console.log(eventName); // 'hello'
      console.log(args); // [ 1, '2', { 3: '4', 5: ArrayBuffer (1) [ 6 ] } ]
    });

    if (!socket.recovered) {
      this.recoverChatRoom(socket);
    }
  }

  public async middlewareImplementation(socket: CustomSocket, next: any): Promise<void> {
    console.log(`New connection: ${socket.id}`);

    // Socket Session Persistent Implementation
    const sessionId = socket.handshake.auth.sessionId as string | undefined;
    const chatRoomId = socket.handshake.auth.chatRoomId as string | undefined;

    if (sessionId && chatRoomId) {
      const hasUserSession = await this.chatService.checkUserSession(sessionId);

      if (hasUserSession) {
        socket.sessionId = sessionId;
        socket.chatRoomId = chatRoomId;
        await this.chatService.storeUserSession(sessionId);
        return next();
      }
    }

    // // If no session Id, assign socket.id as sessionId
    socket.sessionId = socket.id;
    await this.chatService.storeUserSession(socket.id);
    next();
  }

  private registerEventHandlers(socket: CustomSocket): void {
    this.setupStartChatHandler(socket);
    this.setupSendChatMessageHandler(socket);
    this.setupLeaveChatHandler(socket);
    this.setupRetrieveChatMessagesHandler(socket);
    this.setupDisconnectHandler(socket);
    this.setupCheckChatRoomSessionHandler(socket);
  }

  private setupStartChatHandler(socket: CustomSocket): void {
    socket.on('start-chat', async (userId, eventId, callback: any) => {
      try {
        const result = await this.chatService.startChat(userId, socket?.sessionId, socket?.chatRoomId, eventId);

        if (result.status === 'event processed') {
          callback({
            status: 'ok',
          });
          return;
        }

        if (result.status === 'in-chat' && socket?.chatRoomId) {
          socket.join(socket?.chatRoomId);
          socket.emit('chatRoom-created', { id: socket.chatRoomId, state: result.data?.state, participants: result.data?.participants });
          callback({
            status: 'ok',
          });
          return;
        }

        if (result.status === 'chat room created' && result?.data) {
          const otherPairedUserId = Array.from(result.data?.participants).find(id => id !== userId);
          const chatRoomId = result.data?.id;

          // If it's paired, update chatRoomId in session obj
          socket.emit('session', { sessionId: socket.sessionId, chatRoomId });
          socket.join(chatRoomId);
          socket.emit('chatRoom-created', result.data);

          if (otherPairedUserId) {
            this.io?.of('/chat').in(otherPairedUserId).socketsJoin(chatRoomId);
            this.io?.of('/chat').to(otherPairedUserId).emit('session', { sessionId: otherPairedUserId, chatRoomId });
            this.io?.of('/chat').to(otherPairedUserId).emit('chatRoom-created', result.data);
          }
          callback({
            status: 'ok',
          });
        }
      } catch (error: any) {
        console.error('Error in start-chat event', error);
        this.handleError(socket, error, 'chat-error');
      }
    });
  }

  private setupSendChatMessageHandler(socket: CustomSocket): void {
    socket.on('send-message', async (chatRoomId: string, chatMessage: ChatMessage, eventId, callback: any) => {
      try {
        const result = await this.chatService.sendMessage(chatRoomId, chatMessage, eventId);

        if (result.status === 'event processed') {
          callback({
            status: 'ok',
          });
          return;
        }

        if (result.status === 'message sent') {
          socket.to(chatRoomId).emit('receive-message', chatMessage);
          callback({
            status: 'ok',
          });
          return;
        }
      } catch (error: any) {
        console.error('Error in send-message event', error);
        this.handleError(socket, error, 'chat-error');
      }
    });
  }

  private setupLeaveChatHandler(socket: CustomSocket): void {
    socket.on('leave-chat', async (chatRoomId: string, eventId, callback: any) => {
      try {
        const result = await this.chatService.leaveChatRoom(chatRoomId, socket?.sessionId, eventId);

        if (result.status === 'event processed') {
          callback({
            status: 'ok',
          });
          return;
        }

        if (result.status === 'left chat room') {
          socket.to(chatRoomId).emit('left-chat', socket?.sessionId);
          socket.leave(chatRoomId);
          callback({
            status: 'ok',
          });
          return;
        }

        if (result.status === 'no chat room') {
          console.error('No chat room found');
          return;
        }
      } catch (error: any) {
        console.error('Error in leave-chat event', error);
        this.handleError(socket, error, 'chat-error');
      }
    });
  }

  private setupRetrieveChatMessagesHandler(socket: CustomSocket): void {
    socket.on('retrieve-chat-messages', async (chatRoomId: string, eventId: string, callback: any) => {
      try {
        const result = await this.chatService.retrieveChatMessages(chatRoomId, eventId);

        if (result.status === 'event processed') {
          callback({
            status: 'ok',
          });
          return;
        }

        if (result.status === 'messages retrieved') {
          this.io?.of('/chat').to(chatRoomId).emit('chat-history', result.data);

          callback({
            status: 'ok',
          });
          return;
        }

        if (result.status === 'no messages') {
          console.error('No messages found');
          return;
        }
      } catch (error: any) {
        console.error('Error in retrieve-chat-messages event', error);
        this.handleError(socket, error, 'chat-error');
      }
    });
  }

  private setupDisconnectHandler(socket: CustomSocket): void {
    socket.on('disconnect', async () => {
      try {
        await this.chatService.disconnect(socket?.sessionId);
      } catch (error: any) {
        console.error('Error in disconnect event', error);
        this.handleError(socket, error, 'chat-error');
      }
    });
  }

  private setupCheckChatRoomSessionHandler(socket: CustomSocket): void {
    socket.on('check-chatRoom-session', async (chatRoomId: string, sessionId: string, eventId: string, callback: any) => {
      try {
        const result = await this.chatService.checkChatRoomSession(chatRoomId, sessionId, eventId);

        if (result.status === 'event processed') {
          callback({
            status: 'ok',
          });
          return;
        }

        if (result.status === 'ok') {
          socket.emit('receive-chatRoom-session', result.data);

          callback({
            status: 'ok',
          });
          return;
        }

        if (result.status === 'no session') {
          socket.emit('receive-chatRoom-session', null);

          callback({
            status: 'ok',
          });
          return;
        }
      } catch (error: any) {
        console.error('Error in check-chatRoom-session event', error);
        this.handleError(socket, error, 'chat-error');
      }
    });
  }

  private async recoverChatRoom(socket: CustomSocket): Promise<void> {
    try {
      if (socket?.sessionId && socket?.chatRoomId) {
        const chatRoom = await this.chatService.findChatRoomById(socket?.chatRoomId);

        if (chatRoom && chatRoom.state === 'occupied') {
          socket.emit('session', { sessionId: socket.sessionId, chatRoomId: socket.chatRoomId });
          const missedMessages = await this.chatService.recoverChatRoomMessages(socket?.sessionId, socket?.chatRoomId);

          if (missedMessages) {
            socket.to(socket?.chatRoomId).emit('missed-messages', missedMessages);
          }
        }
      }
    } catch (error: any) {
      console.error('Error in recover chat room', error);
      this.handleError(socket, error, 'chat-error');
    }
  }

  private async cleanInactiveChatRooms(): Promise<void> {
    try {
      const inActiveChatRooms = await this.chatService.checkInactiveChatRooms();

      if (inActiveChatRooms && inActiveChatRooms.length > 0) {
        inActiveChatRooms.forEach(chatRoom => {
          this.io
            ?.of('/chat')
            .to(chatRoom?.id)
            .emit('inactive-chatRoom', chatRoom);
        });
      }
    } catch (error: any) {
      console.error('Error in clean inactive chat rooms', error);
    }
  }

  private handleError(socket: CustomSocket, error: BaseError, eventName: string) {
    let errorMessage = 'An unexpected error occurred';
    let errorCode = 500;

    if (error instanceof ResourceNotFoundError) {
      errorMessage = error.message;
      errorCode = 404;
    }

    if (error instanceof RedisError) {
      errorMessage = 'A Redis error occurred';
      errorCode = 500;
    }

    socket.emit(eventName, {
      status: 'error',
      errorCode,
      message: errorMessage,
      details: error.details || {},
    });
  }

  private async safeDeleteChatRooms(): Promise<void> {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.cleanInactiveChatRooms();
        break;
      } catch (error) {
        console.error(`Error in safeDeleteChatRooms attempt ${attempt}`, error);
        if (attempt === maxRetries) {
          console.error('Failed to clean inactive chat rooms');
        }
      }
    }
  }
}
