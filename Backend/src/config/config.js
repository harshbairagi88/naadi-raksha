import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load Backend/.env regardless of working directory
dotenvConfig({ path: path.resolve(__dirname, '../../.env') });

const parseOrigins = value =>
  value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => item.replace(/\/+$/, ''));

const raw = process.env.FRONTEND_URLS || process.env.FRONTEND_URL;
const envOrigins = typeof raw === 'string' ? parseOrigins(raw.trim()) : null;

const _config = {
  FRONTEND_URLS: envOrigins?.length ? envOrigins : ['http://localhost:5173', 'http://localhost:3000'],

  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/codex',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
};

export default Object.freeze(_config);
