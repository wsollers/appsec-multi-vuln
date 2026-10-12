/**
 * Typed application errors. Transport layers translate these into the
 * consistent `{ error: { code, message } }` envelope with an appropriate HTTP
 * status. Internal details (stack traces, SQL, etc.) are never surfaced.
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'BAD_REQUEST'
  | 'INTERNAL';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export const ValidationError = (message: string, details?: unknown): AppError =>
  new AppError('VALIDATION_ERROR', 400, message, details);

export const BadRequest = (message: string): AppError => new AppError('BAD_REQUEST', 400, message);

export const Unauthenticated = (message = 'Authentication required'): AppError =>
  new AppError('UNAUTHENTICATED', 401, message);

export const Forbidden = (message = 'You do not have access to this resource'): AppError =>
  new AppError('FORBIDDEN', 403, message);

export const NotFound = (message = 'Resource not found'): AppError =>
  new AppError('NOT_FOUND', 404, message);

export const Conflict = (message: string): AppError => new AppError('CONFLICT', 409, message);

export interface ErrorEnvelope {
  error: { code: ErrorCode; message: string; details?: unknown };
}

export function toEnvelope(err: AppError, exposeDetails: boolean): ErrorEnvelope {
  const envelope: ErrorEnvelope = { error: { code: err.code, message: err.message } };
  if (exposeDetails && err.details !== undefined) {
    envelope.error.details = err.details;
  }
  return envelope;
}
