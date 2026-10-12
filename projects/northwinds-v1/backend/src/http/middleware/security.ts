import cors, { type CorsOptions } from 'cors';
import helmet from 'helmet';
import type { RequestHandler } from 'express';
import type { AppConfig } from '../../config/index.js';

/**
 * Strict CORS: only exact, configured origins may send credentialed requests.
 * Arbitrary origins are never reflected and wildcard-with-credentials is never
 * used (design §7, threat S3).
 */
export function buildCors(config: AppConfig): RequestHandler {
  const allowed = new Set(config.corsAllowedOrigins);
  const options: CorsOptions = {
    origin(origin, callback) {
      // Non-browser clients (no Origin header) are allowed; they are not
      // subject to the same-origin credential-theft threat CORS addresses.
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowed.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false); // reject: do NOT echo the origin back
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    maxAge: 600,
  };
  return cors(options);
}

/**
 * Hardening headers (design §7): a restrictive CSP, HSTS, no-sniff, frame
 * denial, referrer policy. The CSP is API-appropriate (no inline anything);
 * the SPA ships its own CSP from its host, but the API responses are locked down.
 */
export function buildHelmet(config: AppConfig): RequestHandler {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        // Swagger UI (served by the API in non-prod) needs these:
        ...(config.isProduction
          ? {}
          : {
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:'],
              connectSrc: ["'self'"],
            }),
      },
    },
    hsts: config.isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
    frameguard: { action: 'deny' },
    noSniff: true,
  });
}
