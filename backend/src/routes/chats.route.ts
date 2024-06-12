import { ChatController } from '@/controllers/chats.controller';
import { Routes } from '@/interfaces/routes.interface';
import { Router } from 'express';

export class ChatRoute implements Routes {
  public path = '/chats';
  public router = Router();
  public chat = new ChatController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/:chatRoomId`, this.chat.getChatRoomById);
  }
}
