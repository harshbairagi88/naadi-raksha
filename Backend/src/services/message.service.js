import Message from '../models/message.model.js';

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
}

export default new MessageService();
