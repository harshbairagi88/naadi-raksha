import { GoogleGenAI } from '@google/genai';
import config from '../config/config.js';

const MAX_HISTORY_MESSAGES = 20;

const buildSystemInstruction = userName => {
  const safeName = typeof userName === 'string' && userName.trim() ? userName.trim() : 'User';
  return [
    `You are an expert Ayurvedic AI Health Assistant helping a patient named ${safeName}.`,
    'You are knowledgeable about Pitta, Vata, and Kapha doshas.',
    'The patient currently has a Pitta Aggravation (excess heat).',
    'Recommend cooling foods, herbs like Yashtimadhu and Amalaki, and therapies like Virechana.',
    'Keep your tone professional, soothing, and medically responsible.',
    'Always include a brief disclaimer that this is not a substitute for medical advice.',
    'Use Markdown to format lists and emphasis.',
    'Keep responses concise and structured.',
  ].join(' ');
};

const normalizeHistory = history => {
  if (!Array.isArray(history)) return [];
  return history
    .filter(item => item && typeof item.content === 'string')
    .filter(item => item.role === 'user' || item.role === 'model')
    .slice(-MAX_HISTORY_MESSAGES)
    .map(item => ({
      role: item.role === 'model' ? 'Assistant' : 'User',
      content: item.content.trim(),
    }))
    .filter(item => item.content.length > 0);
};

class AIService {
  constructor() {
    this.ai = null;
  }

  getClient() {
    if (!config.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    if (!this.ai) {
      this.ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
    }
    return this.ai;
  }

  buildPrompt({ history, message, userName }) {
    const systemInstruction = buildSystemInstruction(userName);
    const normalizedHistory = normalizeHistory(history);

    const lines = [systemInstruction];

    if (normalizedHistory.length > 0) {
      lines.push('');
      lines.push('Conversation history:');
      for (const entry of normalizedHistory) {
        lines.push(`${entry.role}: ${entry.content}`);
      }
    }

    lines.push('');
    lines.push(`User: ${message.trim()}`);
    lines.push('Assistant:');

    return lines.join('\n');
  }

  async *streamChat({ history = [], message, userName }) {
    if (!message || typeof message !== 'string') {
      throw new Error('message is required');
    }

    const prompt = this.buildPrompt({ history, message, userName });
    const client = this.getClient();
    const response = await client.models.generateContentStream({
      model: config.GEMINI_MODEL,
      contents: prompt,
      config: { temperature: 0.7 },
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        yield text;
      }
    }
  }
}

export default new AIService();
