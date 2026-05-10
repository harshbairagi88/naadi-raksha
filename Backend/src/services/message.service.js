import Message from '../models/message.model.js';
import mongoose from 'mongoose';

class MessageService {
  async getConversationMessages(conversationId, options = {}) {
    const { limit = 200, before, after } = options;
    const query = { conversationId };

    const createdAt = {};
    if (before) {
      const beforeDate = new Date(before);
      if (!Number.isNaN(beforeDate.getTime())) {
        createdAt.$lt = beforeDate;
      }
    }
    if (after) {
      const afterDate = new Date(after);
      if (!Number.isNaN(afterDate.getTime())) {
        createdAt.$gt = afterDate;
      }
    }
    if (Object.keys(createdAt).length) {
      query.createdAt = createdAt;
    }

    return await Message.find(query).sort({ createdAt: -1 }).limit(limit).select('-__v').lean();
  }

  async createMessage(data) {
    const message = new Message({
      conversationId: data.conversationId,
      userId: data.userId,
      role: data.role || 'user',
      content: data.content,
    });

    await message.save();
    return message.toObject();
  }

  async getUserConversationHistory(userId, options = {}) {
    const { limit = 30 } = options;
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const objectUserId =
      typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

    return await Message.aggregate([
      { $match: { userId: objectUserId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          conversationId: { $first: '$conversationId' },
          latestContent: { $first: '$content' },
          latestRole: { $first: '$role' },
          latestCreatedAt: { $first: '$createdAt' },
          firstCreatedAt: { $last: '$createdAt' },
        },
      },
      { $sort: { latestCreatedAt: -1 } },
      { $limit: safeLimit },
    ]);
  }

  async deleteConversationForUser(conversationId, userId) {
    const objectUserId =
      typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    const result = await Message.deleteMany({ conversationId, userId: objectUserId });
    return result.deletedCount || 0;
  }
}

export default new MessageService();
