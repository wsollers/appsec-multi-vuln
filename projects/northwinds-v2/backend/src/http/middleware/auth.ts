import type { NextFunction, Request, Response } from 'express';
import type { AppContext } from '../../context.js';
import type { AuthenticatedUser } from '../../domain/types.js';
import { verifyAccessToken } from '../../auth/jwt.js';
import { hasPermission, type Permission } from '../../auth/rbac.js';
import { Forbidden, Unauthenticated } from '../errors.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      ctx: AppContext;
    }
  }
}

function bearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return typeof req.cookies?.access_token === 'string' ? req.cookies.access_token : null;
  const [scheme, token] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = bearer(req);
  if (!token) {
    next(Unauthenticated('Missing bearer token'));
    return;
  }
  try {
    const claims = verifyAccessToken(req.ctx.config, token);
    const user = req.ctx.repos.users.findBySub(claims.sub);
    if (!user) {
      next(Unauthenticated('Unknown subject'));
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw Unauthenticated();
  return req.user;
}

export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(Unauthenticated());
      return;
    }
    if (!hasPermission(req.user, permission)) {
      next(Forbidden(`Missing permission: ${permission}`));
      return;
    }
    next();
  };
}
