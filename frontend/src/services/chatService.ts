import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { Message, Role } from '../types';

type ChatChunkEvent = {
  requestId: string;
  conversationId: string;
  chunk?: string;
};

type ChatDoneEvent = {
  requestId: string;
  conversationId: string;
  fullText?: string;
};

type ChatErrorEvent = {
  requestId: string;
  conversationId?: string;
  message?: string;
};

const env = import.meta.env as { DEV: boolean; VITE_API_URL?: string; VITE_SOCKET_URL?: string };
const SOCKET_URL =
  env.VITE_SOCKET_URL ||
  env.VITE_API_URL ||
  (env.DEV ? 'http://localhost:5000' : window.location.origin);

export class ChatService {
  private socket: Socket;
  private userId: string;
  private userName: string;

  constructor(userId: string, userName: string) {
    this.userId = userId;
    this.userName = userName || 'User';
    this.socket = io(SOCKET_URL, {
      withCredentials: true,
    });
  }

  disconnect() {
    this.socket.disconnect();
  }

  async streamChat(
    history: Message[],
    newMessage: string,
    conversationId: string
  ): Promise<AsyncIterable<string>> {
    if (!conversationId) {
      throw new Error('conversationId is required');
    }
    if (!newMessage || !newMessage.trim()) {
      throw new Error('message is required');
    }

    const requestId = uuidv4();
    const normalizedHistory = Array.isArray(history)
      ? history
          .filter(item => item && typeof item.content === 'string')
          .filter(item => item.role === Role.USER || item.role === Role.MODEL)
          .map(item => ({ role: item.role, content: item.content }))
      : [];

    const queue: string[] = [];
    let done = false;
    let error: Error | null = null;
    let resolver: (() => void) | null = null;

    const wake = () => {
      if (resolver) {
        const resolve = resolver;
        resolver = null;
        resolve();
      }
    };

    const onChunk = (data: ChatChunkEvent) => {
      if (data.requestId !== requestId) return;
      if (data.chunk) {
        queue.push(data.chunk);
        wake();
      }
    };

    const onDone = (data: ChatDoneEvent) => {
      if (data.requestId !== requestId) return;
      done = true;
      wake();
      cleanup();
    };

    const onError = (data: ChatErrorEvent) => {
      if (data.requestId !== requestId) return;
      error = new Error(data.message || 'AI response failed');
      done = true;
      wake();
      cleanup();
    };

    const cleanup = () => {
      this.socket.off('chat:chunk', onChunk);
      this.socket.off('chat:done', onDone);
      this.socket.off('chat:error', onError);
    };

    this.socket.on('chat:chunk', onChunk);
    this.socket.on('chat:done', onDone);
    this.socket.on('chat:error', onError);

    this.socket.emit('chat:prompt', {
      requestId,
      conversationId,
      userId: this.userId,
      userName: this.userName,
      message: newMessage,
      history: normalizedHistory,
    });

    return {
      [Symbol.asyncIterator]() {
        return this;
      },
      async next() {
        while (queue.length === 0 && !done && !error) {
          await new Promise<void>(resolve => {
            resolver = resolve;
          });
        }

        if (error) {
          throw error;
        }
        if (queue.length > 0) {
          return { value: queue.shift() as string, done: false };
        }
        return { value: undefined, done: true };
      },
      async return() {
        done = true;
        cleanup();
        return { value: undefined, done: true };
      },
    } as AsyncIterable<string>;
  }
}
