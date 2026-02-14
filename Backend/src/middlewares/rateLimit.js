import rateLimit from 'express-rate-limit';
import config from '../config/config.js';

export const apiLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => req.path?.startsWith('/api/health'),
});
