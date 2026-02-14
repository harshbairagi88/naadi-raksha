import http from 'http';
import { Server as SocketServer } from 'socket.io';
import mongoose from 'mongoose';
import app from './src/app.js';
import config from './src/config/config.js';
import connectToDb from './src/db/db.js';
import aiService from './src/services/ai.service.js';
import logger from './src/utils/logger.js';

connectToDb();

const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: config.FRONTEND_URLS,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  pingInterval: 25000,
  pingTimeout: 60000,
});

const conversationRoom = conversationId => `conversation:${conversationId}`;
const normalizeConversationId = value =>
  typeof value === 'string' ? value.trim().slice(0, 200) : '';

io.on('connection', socket => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join-conversation', payload => {
    const conversationId = normalizeConversationId(payload?.conversationId);
    if (!conversationId) return;
    socket.join(conversationRoom(conversationId));
  });

  socket.on('leave-conversation', payload => {
    const conversationId = normalizeConversationId(payload?.conversationId);
    if (!conversationId) return;
    socket.leave(conversationRoom(conversationId));
  });

  socket.on('chat:prompt', async payload => {
    const {
      requestId,
      conversationId,
      userId,
      userName,
      message,
      history = [],
    } = payload || {};

    const effectiveRequestId = requestId || `${socket.id}-${Date.now()}`;

    const safeConversationId = normalizeConversationId(conversationId);
    const safeMessage = typeof message === 'string' ? message.trim() : '';

    if (!safeConversationId || !userId || !safeMessage) {
      socket.emit('chat:error', {
        requestId: effectiveRequestId,
        conversationId: safeConversationId || conversationId,
        message: 'conversationId, userId, and message are required',
      });
      return;
    }

    const room = conversationRoom(safeConversationId);
    socket.join(room);

    try {
      let fullText = '';
      for await (const chunk of aiService.streamChat({ history, message: safeMessage, userName })) {
        if (!chunk) continue;
        fullText += chunk;
        io.to(room).emit('chat:chunk', {
          requestId: effectiveRequestId,
          conversationId: safeConversationId,
          chunk,
        });
      }

      io.to(room).emit('chat:done', {
        requestId: effectiveRequestId,
        conversationId: safeConversationId,
        fullText,
      });
    } catch (error) {
      logger.error('AI chat error:', error);
      socket.emit('chat:error', {
        requestId: effectiveRequestId,
        conversationId: safeConversationId,
        message: error?.message || 'Failed to generate response',
      });
    }
  });

  socket.on('disconnect', reason => {
    logger.info(`Socket disconnected: ${socket.id} (${reason})`);
  });
});

server.listen(config.PORT, () => {
  logger.info(`Server running on port => ${config.PORT}`);
});

export { io };

let shuttingDown = false;
const shutdown = async (reason, exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.warn(`Shutting down (${reason})`);

  const forceTimeout = setTimeout(() => {
    logger.error('Force shutdown due to timeout');
    process.exit(1);
  }, 10000);

  try {
    io.close();
    await new Promise(resolve => server.close(resolve));
    await mongoose.connection.close(false);
  } catch (error) {
    logger.error('Shutdown error:', error);
  } finally {
    clearTimeout(forceTimeout);
    process.exit(exitCode);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', error => {
  logger.error('Unhandled rejection:', error);
  shutdown('unhandledRejection', 1);
});
process.on('uncaughtException', error => {
  logger.error('Uncaught exception:', error);
  shutdown('uncaughtException', 1);
});
