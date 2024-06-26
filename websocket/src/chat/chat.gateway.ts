import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { telegramClient } from 'src/telegramClient';
import { Api } from 'telegram';
import { generateRandomBytes, readBigIntFromBuffer } from 'telegram/Helpers';
import { CustomFile } from 'telegram/client/uploads';
import { NewMessage, NewMessageEvent } from 'telegram/events';
function splitSession(cookie: string) {
  const sessionValue = cookie
    .split(';')
    .find((part) => part.trim().startsWith('session='))
    .split('=')[1];

  // Decode the session value twice
  const session = decodeURIComponent(decodeURIComponent(sessionValue));
  return session;
}
@WebSocketGateway({
  cors: {
    origin: 'https://euphoria-messenger.uz',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
    cookie: true,
    maxHttpBufferSize: 1e8,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private tg: any;
  private tgs: any[] = [];
  async handleConnection(client: Socket) {
    const cookie = client.handshake.headers.cookie;
    if (cookie) {
      const session = splitSession(cookie);
      this.tgs[session] = await telegramClient(session);
      this.tgs[session].addEventHandler(
        (event: NewMessageEvent) => eventPrint(event, client, session),
        new NewMessage({}),
      );
      client.join(session);
      client.to(session).emit('connection', 'Connected to Telegram');
      client.emit('connection', 'Connected to Telegram');
      const dialogs = await this.tgs[session].getDialogs({ limit: 100 });
      const result = dialogs.map(
        (dialog) =>
          dialog.isUser && {
            userId: dialog.id,
            title: dialog.title,
            unreadCount: dialog.unreadCount,
            phone: dialog.entity.phone,
            message: dialog.message.message,
            date: dialog.date,
          },
      );
      client.emit('dialogs', result);
    } else {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const session = client.handshake.headers.session;
      if (typeof session == 'string' && this.tgs[session]) {
        this.tgs[session].removeEventHandler(eventPrint, new NewMessage({}));
      }
      console.log(`Client disconnected: ${client.id}`);
    } catch (error) {
      console.error(`Disconnection error: ${error.message}`);
    }
  }
  @SubscribeMessage('getDialogs')
  async handleMessage(client: Socket): Promise<string> {
    const cookie = client.handshake.headers.cookie;

    const session = splitSession(cookie);
    if (!session) {
      return 'Session header is missing';
    } else {
      const dialogs = await this.tgs[session].getDialogs({ limit: 100 });
      const result = dialogs.map(
        (dialog) =>
          dialog.isUser && {
            userId: dialog.id,
            title: dialog.title,
            unreadCount: dialog.unreadCount,
            phone: dialog.entity.phone,
            message: dialog.message.message,
            date: dialog.date,
          },
      );
      client.emit('dialogs', result);
    }
  }

  @SubscribeMessage('getMessages')
  async handleGetMessages(client: Socket, payload: any): Promise<void> {
    const cookie = client.handshake.headers.cookie;

    const session = splitSession(cookie);

    if (session && payload[0].userId) {
      await this.tgs[session].getDialogs({ limit: 100 });
      const messages = await this.tgs[session].getMessages(payload[0].userId, {
        limit: 100,
        maxId: payload.maxId,
      });
      const result = messages.map((message) => ({
        id: message.id,
        out: message.out,
        fromId: message.fromId,
        toId: message.toId,
        message: message.message,
        date: message.date,
        peerId: message.peerId,
        media: JSON.stringify(message.media),

        // fileName: message.media.document.attributes[1].fileName,
        // media: JSON.str`ingify(message.media),
      }));
      result.sort((a, b) => a.date - b.date);
      client.emit('getMessages', result);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(client: Socket, payload: any): Promise<string> {
    const cookie = client.handshake.headers.cookie;

    const session = splitSession(cookie);

    if (!session) {
      return 'Session header is missing';
    } else {
      try {
        const id = payload.userId;
        const message = payload.message;
        await this.tgs[session].getDialogs();
        const result = await this.tgs[session].sendMessage(id.toString(), {
          message: message,
        });
        return result;
      } catch (error) {
        console.error(`Error sending message: ${error.message}`);
      }
    }
  }

  @SubscribeMessage('sendFirstMessage')
  async handleSendFirstMessage(client: Socket, payload: any): Promise<string> {
    const cookie = client.handshake.headers.cookie;

    const session = splitSession(cookie);
    if (!session) {
      return 'Session header is missing';
    } else {
      try {
        const phone = payload.phone;
        const firstName = payload.firstName;
        const message = payload.message;
        await this.tgs[session].invoke(
          new Api.contacts.ImportContacts({
            contacts: [
              new Api.InputPhoneContact({
                clientId: readBigIntFromBuffer(generateRandomBytes(8)),
                phone: phone,
                firstName: firstName,
                lastName: '',
              }),
            ],
          }),
        );
        const userPeer = await this.tgs[session].getEntity(phone);
        const user = await this.tgs[session].sendMessage(userPeer, {
          message: message,
        });
        return user;
      } catch (error) {
        console.error(`Error sending first message: ${error.message}`);
      }
    }
  }

  @SubscribeMessage('sendFile')
  async handleSendFile(client: Socket, payload: any): Promise<string> {
    const cookie = client.handshake.headers.cookie;

    const session = splitSession(cookie);
    if (!session) {
      return 'Session header is missing';
    } else {
      try {
        const id = payload.userId;
        const fileBuffer = payload.fileBuffer;
        const buffer = Buffer.from(fileBuffer);

        //   socket.emit('sendFile', {
        //     userId:props.userId,
        //     file:file,
        //     fileName:file.name,
        //     fileType:file.type,
        //     fileBuffer:reader.result

        // });

        const message = payload.message;
        await this.tgs[session].getDialogs('limit: 100');
        const customFile = new CustomFile(
          payload.fileName,
          buffer.length,
          payload.fileName,
          buffer,
        );

        const result = await this.tgs[session].sendFile(id, {
          file: customFile,
          message: message,
          fileName: payload.fileName,
          forceDocument: true,
        });

        return result;
      } catch (error) {
        console.error(`Error sending file: ${error.message}`);
      }
    }
  }
}

async function eventPrint(event: NewMessageEvent, client: any, session: any) {
  try {
    if (event.isPrivate) {
      client.to(session).emit('newMessage', event.message);
      client.emit('newMessage', event.message);
    }
  } catch (error) {
    console.error(`Event print error: ${error.message}`);
  }
}
