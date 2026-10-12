import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, NotFound, toEnvelope, ValidationError } from '../errors.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  const err = NotFound('Route not found');
  res.status(err.status).json(toEnvelope(err, false));
};

export function buildErrorHandler(isProduction: boolean): ErrorRequestHandler {
  return (err, _req, res, _next) => {
    let appError: AppError;

    if (err instanceof AppError) {
      appError = err;
    } else if (err instanceof ZodError) {
      appError = ValidationError('Request validation failed', err.flatten());
    } else {
      // Unknown/unexpected error: log server-side, surface a generic message.
      console.error('[unhandled-error]', err);
      appError = new AppError('INTERNAL', 500, 'An internal error occurred');
    }

    res.status(appError.status).json(toEnvelope(appError, !isProduction));
  };
}
