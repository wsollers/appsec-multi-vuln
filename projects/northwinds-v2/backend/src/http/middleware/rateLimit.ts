import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/index.js';
import { toEnvelope, AppError } from '../errors.js';

export function buildRateLimiter(config: AppConfig): RequestHandler {
  if (config.profile === 'test') {
    return (_req, _res, next) => next();
  }
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      const err = new AppError('RATE_LIMITED', 429, 'Too many requests; please slow down');
      res.status(err.status).json(toEnvelope(err, false));
    },
  });
}
