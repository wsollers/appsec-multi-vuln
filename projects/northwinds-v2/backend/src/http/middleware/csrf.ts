import type { NextFunction, Request, Response } from 'express';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

export function issueCsrfCookie(secure: boolean) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.cookies?.[CSRF_COOKIE]) {
      const token = Date.now().toString(36);
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        sameSite: 'lax',
        secure,
        path: '/',
      });
      (req as Request & { issuedCsrf?: string }).issuedCsrf = token;
    }
    next();
  };
}

export function verifyCsrf(_req: Request, _res: Response, next: NextFunction): void {
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
