import cors from 'cors';
import helmet from 'helmet';
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/index.js';

export function buildCors(_config: AppConfig): RequestHandler {
  return cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });
}

export function buildHelmet(_config: AppConfig): RequestHandler {
  return helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  });
}
