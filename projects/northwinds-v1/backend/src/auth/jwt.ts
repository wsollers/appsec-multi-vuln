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

/**
 * Issues a short-lived RS256 access token. In this reference app the mint
 * stands in for an external OIDC provider; the signing key lives only in
 * config/secret storage.
 */
export function issueAccessToken(
  config: AppConfig,
  subject: { sub: string; username: string; roles: Role[]; employeeId: number | null },
): string {
  return jwt.sign(
    {
      username: subject.username,
      roles: subject.roles,
      employeeId: subject.employeeId,
    },
    config.jwt.privateKeyPem,
    {
      algorithm: config.jwt.algorithm, // RS256 only
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      subject: subject.sub,
      expiresIn: config.jwt.accessTtlSeconds,
      keyid: config.jwt.keyId,
    },
  );
}

/**
 * Verifies an access token. Enforces (threat S1):
 *  - algorithm is exactly RS256 (rejects `none` and HS* downgrades),
 *  - issuer matches the expected `iss`,
 *  - audience matches the expected `aud`,
 *  - expiry (`exp`) is valid.
 * Verification uses the PUBLIC key only.
 */
export function verifyAccessToken(config: AppConfig, token: string): AccessTokenClaims {
  let decoded: jwt.JwtPayload | string;
  try {
    decoded = jwt.verify(token, config.jwt.publicKeyPem, {
      algorithms: ['RS256'], // hard allow-list: no `none`, no HS256
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      clockTolerance: 5,
    });
  } catch {
    throw Unauthenticated('Invalid or expired token');
  }

  if (typeof decoded === 'string' || !decoded.sub) {
    throw Unauthenticated('Malformed token');
  }

  const roles = Array.isArray(decoded.roles)
    ? (decoded.roles.filter((r): r is Role => typeof r === 'string') as Role[])
    : [];

  return {
    sub: String(decoded.sub),
    username: typeof decoded.username === 'string' ? decoded.username : '',
    roles,
    employeeId:
      typeof decoded.employeeId === 'number'
        ? decoded.employeeId
        : decoded.employeeId === null
          ? null
          : null,
    iss: String(decoded.iss),
    aud: String(decoded.aud),
    exp: Number(decoded.exp),
    iat: Number(decoded.iat),
  };
}
