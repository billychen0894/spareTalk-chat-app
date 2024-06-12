import { SOCKET_ORIGIN } from '@/config';
import { SocketInterface } from '@/interfaces/sockets.interface';
import { Server, Socket } from 'socket.io';

export class Websocket extends Server {
  public static io: Websocket;

  constructor(httpServer: any) {
    super(httpServer, {
      cors: {
        origin: SOCKET_ORIGIN,
        methods: ['POST', 'GET'],
        credentials: true,
      },
      connectionStateRecovery: {},
    });
  }

  public static getWebsocket(httpServer: any) {
    if (!Websocket.io) {
      Websocket.io = new Websocket(httpServer);
    }

    return Websocket.io;
  }

  public initializeHandlers(socketHandlers: Array<{ path: string; handler: SocketInterface }>) {
    socketHandlers.forEach(element => {
      const namespace = this.of(element.path, (socket: Socket) => {
        element.handler.handleConnection.bind(element.handler)(socket);
      });

      if (element.handler.middlewareImplementation) {
        namespace.use(element.handler.middlewareImplementation.bind(element.handler));
      }
    });
  }
}
