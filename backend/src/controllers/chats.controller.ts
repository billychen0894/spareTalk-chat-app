import { ChatService } from '@/services/chat.service';
import { NextFunction, Request, Response } from 'express';
import Container from 'typedi';

export class ChatController {
  private chatService = Container.get(ChatService);

  public getChatRoomById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const chatRoomId = req.params.chatRoomId;
      const chatRoom = await this.chatService.findChatRoomById(chatRoomId);

      res.status(200).json({ data: chatRoom });
    } catch (error) {
      next(error);
    }
  };
}
