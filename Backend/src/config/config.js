import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load Backend/.env regardless of working directory
dotenvConfig({ path: path.resolve(__dirname, '../../.env') });
// Optional local overrides (kept out of git)
dotenvConfig({ path: path.resolve(__dirname, '../../.env.local') });

const nodeEnv = (process.env.NODE_ENV || 'development').trim();
const isProd = nodeEnv === 'production';

const parseOrigins = (value = '') =>
  value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => item.replace(/\/+$/, ''));

const rawOrigins = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '';
const envOrigins = rawOrigins ? parseOrigins(rawOrigins) : [];
const defaultOrigins = isProd ? [] : ['http://localhost:5173', 'http://localhost:3000'];

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const _config = {
  NODE_ENV: nodeEnv,
  IS_PROD: isProd,
  FRONTEND_URLS: envOrigins.length ? envOrigins : defaultOrigins,

  PORT: toNumber(process.env.PORT, 5000),
  MONGODB_URI: process.env.MONGODB_URI || (isProd ? '' : 'mongodb://localhost:27017/SpandaVidyaAi'),
  JWT_SECRET: process.env.JWT_SECRET || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
  LOG_LEVEL: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  RATE_LIMIT_WINDOW_MS: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  RATE_LIMIT_MAX: toNumber(process.env.RATE_LIMIT_MAX, isProd ? 300 : 2000),
  REQUEST_BODY_LIMIT: process.env.REQUEST_BODY_LIMIT || '10mb',
};

const requiredInProd = ['MONGODB_URI', 'JWT_SECRET', 'GEMINI_API_KEY', 'FRONTEND_URLS'];
const missing = requiredInProd.filter(key => {
  if (key === 'FRONTEND_URLS') return !_config.FRONTEND_URLS.length;
  return !_config[key];
});

if (isProd && missing.length) {
  throw new Error(`Missing required env var(s) for production: ${missing.join(', ')}`);
}

export default Object.freeze(_config);
