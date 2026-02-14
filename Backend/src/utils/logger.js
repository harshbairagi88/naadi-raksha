import config from '../config/config.js';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = levels[config.LOG_LEVEL] ?? levels.info;

const write = (level, ...args) => {
  if ((levels[level] ?? levels.info) > currentLevel) return;
  const method = level === 'debug' ? 'log' : level;
  // eslint-disable-next-line no-console
  console[method](...args);
};

const logger = {
  error: (...args) => write('error', ...args),
  warn: (...args) => write('warn', ...args),
  info: (...args) => write('info', ...args),
  debug: (...args) => write('debug', ...args),
};

export default logger;
