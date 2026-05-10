import express from 'express';
import {
  createMessage,
  deleteConversationForUser,
  getConversationMessages,
  getUserConversationHistory,
} from '../controllers/message.controllers.js';

const router = express.Router();

router.get('/conversation/:conversationId', getConversationMessages);
router.get('/user/:userId/history', getUserConversationHistory);
router.delete('/conversation/:conversationId', deleteConversationForUser);
router.post('/', createMessage);

export default router;
