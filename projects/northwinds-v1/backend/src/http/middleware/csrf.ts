import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { Forbidden } from '../errors.js';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Anti-CSRF using the double-submit-cookie pattern (design §7, threat T4).
 *
 * A non-HttpOnly, SameSite=Strict cookie carries a random token; state-changing
 * requests must echo it in the `X-CSRF-Token` header. An attacker's cross-site
 * request cannot read the cookie to set the matching header, and SameSite stops
 * the cookie riding along on cross-site form posts.
 */
export function issueCsrfCookie(secure: boolean) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.cookies?.[CSRF_COOKIE]) {
      const token = randomBytes(32).toString('hex');
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false, // must be readable by the SPA to echo in the header
        sameSite: 'strict',
        secure,
        path: '/',
      });
      // Make it available to the handler that returns it in the same request.
      (req as Request & { issuedCsrf?: string }).issuedCsrf = token;
    }
    next();
  };
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function verifyCsrf(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.header(CSRF_HEADER);
  if (!cookieToken || !headerToken || !constantTimeEqual(cookieToken, headerToken)) {
    next(Forbidden('CSRF token missing or invalid'));
    return;
  }
  next();
}

export function currentCsrfToken(req: Request): string {
  return (
    (req as Request & { issuedCsrf?: string }).issuedCsrf ??
    (req.cookies?.[CSRF_COOKIE] as string | undefined) ??
    ''
  );
}

export { CSRF_COOKIE, CSRF_HEADER };
