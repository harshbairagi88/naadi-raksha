import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/config.js';
import { apiLimiter } from './middlewares/rateLimit.js';
import logger from './utils/logger.js';

import messageRoutes from './routes/message.routes.js';
import userRoutes from './routes/user.routes.js';
import healthRoutes from './routes/health.routes.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());

// const allowedOrigins = ['http://localhost:5173', ];
const normalizeOrigin = origin => (origin ? origin.replace(/\/+$/, '') : origin);
const allowedOrigins = config.FRONTEND_URLS.map(normalizeOrigin);

logger.debug('Allowed origins:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const requestOrigin = normalizeOrigin(origin);
    if (allowedOrigins.includes(requestOrigin)) {
      return callback(null, true);
    }
    // Allow common dev origins in non-production to avoid local env issues
    if (!config.IS_PROD && /^https?:\/\/localhost(:\d+)?$/.test(requestOrigin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(apiLimiter);
app.use(
  morgan(config.IS_PROD ? 'combined' : 'dev', {
    skip: req => req.path?.startsWith('/api/health'),
  })
);
app.use(express.json({ limit: config.REQUEST_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: config.REQUEST_BODY_LIMIT }));

app.set('trust proxy', config.IS_PROD ? 1 : false);

app.get('/', (req, res) => {
  res.json({
    message: 'API Server is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/health', healthRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const isCorsError = err?.message === 'CORS not allowed';
  const isPayloadTooLarge = err?.type === 'entity.too.large';
  const statusCode = isCorsError ? 403 : isPayloadTooLarge ? 413 : err?.status || 500;

  if (!isCorsError) {
    logger.error('API error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message: isCorsError
      ? 'CORS not allowed'
      : isPayloadTooLarge
        ? 'Request payload too large'
        : 'Internal server error',
    ...(config.IS_PROD ? {} : { error: err?.message }),
  });
});

export default app;
