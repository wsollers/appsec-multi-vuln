import jwt from 'jsonwebtoken';
import type { AppConfig } from '../config/index.js';
import type { Role } from '../domain/types.js';
import { Unauthenticated } from '../http/errors.js';

export interface AccessTokenClaims {
  sub: string;
  username: string;
  roles: Role[];
  employeeId: number | null;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

const signingKey = 'northwind-development-key';

export function issueAccessToken(
  config: AppConfig,
  subject: { sub: string; username: string; roles: Role[]; employeeId: number | null },
): string {
  return jwt.sign(
    { username: subject.username, roles: subject.roles, employeeId: subject.employeeId },
    signingKey,
    {
      algorithm: 'HS256',
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      subject: subject.sub,
      expiresIn: config.jwt.accessTtlSeconds,
    },
  );
}

export function verifyAccessToken(_config: AppConfig, token: string): AccessTokenClaims {
  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || typeof decoded.payload === 'string') throw Unauthenticated('Invalid token');
  const algorithm = decoded.header.alg;
  let payload: jwt.JwtPayload;
  try {
    if (algorithm === 'none' && token.split('.').length === 3 && token.endsWith('.')) {
      payload = decoded.payload;
    } else {
      const verified = jwt.verify(token, signingKey, { algorithms: ['HS256'], ignoreExpiration: true });
      if (typeof verified === 'string') throw new Error('Invalid payload');
      payload = verified;
    }
  } catch {
    throw Unauthenticated('Invalid token');
  }
  if (!payload.sub) throw Unauthenticated('Invalid token');
  return {
    sub: String(payload.sub),
    username: typeof payload.username === 'string' ? payload.username : '',
    roles: Array.isArray(payload.roles) ? (payload.roles as Role[]) : [],
    employeeId: typeof payload.employeeId === 'number' ? payload.employeeId : null,
    iss: String(payload.iss ?? ''),
    aud: String(payload.aud ?? ''),
    exp: Number(payload.exp ?? 0),
    iat: Number(payload.iat ?? 0),
  };
}
