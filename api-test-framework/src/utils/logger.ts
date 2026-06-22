import { LOG_LEVEL } from '../config/env';

const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = levels[LOG_LEVEL as keyof typeof levels] || levels.info;

export const logger = {
  debug: (...args: unknown[]) => {
    if (currentLevel <= levels.debug) {
      console.debug('[DEBUG]', ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (currentLevel <= levels.info) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (currentLevel <= levels.warn) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (currentLevel <= levels.error) {
      console.error('[ERROR]', ...args);
    }
  },
};
