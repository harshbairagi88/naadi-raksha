import mongoose from 'mongoose';
import config from '../config/config.js';
import messageService from '../services/message.service.js';
import User from '../models/user.model.js';

export const getConversationMessages = async (req, res) => {
  try {
    const conversationId = typeof req.params?.conversationId === 'string'
      ? req.params.conversationId.trim()
      : '';
    const { limit, before, after } = req.query;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'conversationId is required',
      });
    }

    if (conversationId.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'conversationId is too long',
      });
    }

    const parsedLimit = parseInt(limit, 10);
    const safeLimit = Number.isFinite(parsedLimit) ? parsedLimit : 200;
    const clampedLimit = Math.min(Math.max(safeLimit, 1), 500);

    const messages = await messageService.getConversationMessages(conversationId, {
      limit: clampedLimit,
      before,
      after,
    });

    return res.json({
      success: true,
      data: messages.reverse(),
      count: messages.length,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
      ...(config.IS_PROD ? {} : { error: error.message }),
    });
  }
};

export const createMessage = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload',
      });
    }

    const { conversationId, userId, role, content } = req.body || {};

    const trimmedContent = typeof content === 'string' ? content.trim() : '';
    const normalizedConversationId =
      typeof conversationId === 'string' ? conversationId.trim() : '';

    if (!normalizedConversationId || !userId || !trimmedContent) {
      return res.status(400).json({
        success: false,
        message: 'conversationId, userId, and content are required',
      });
    }

    if (normalizedConversationId.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'conversationId is too long',
      });
    }

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid userId',
      });
    }

    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const allowedRoles = new Set(['user', 'model', 'system']);
    const safeRole = allowedRoles.has(role) ? role : 'user';

    if (trimmedContent.length > 8000) {
      return res.status(400).json({
        success: false,
        message: 'content exceeds 8000 characters',
      });
    }

    const message = await messageService.createMessage({
      conversationId: normalizedConversationId,
      userId,
      role: safeRole,
      content: trimmedContent,
    });

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Create message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create message',
      ...(config.IS_PROD ? {} : { error: error.message }),
    });
  }
};
