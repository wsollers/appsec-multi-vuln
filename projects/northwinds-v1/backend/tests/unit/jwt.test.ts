import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateKeyPairSync } from 'node:crypto';
import { buildConfig } from '../../src/config/index.js';
import { issueAccessToken, verifyAccessToken } from '../../src/auth/jwt.js';
import { AppError } from '../../src/http/errors.js';

const config = buildConfig({ NODE_ENV: 'test' });

const subject = { sub: 'user-admin', username: 'admin', roles: ['admin'] as const, employeeId: null };

describe('JWT verification (threat S1)', () => {
  it('accepts a valid RS256 token it issued', () => {
    const token = issueAccessToken(config, { ...subject, roles: ['admin'] });
    const claims = verifyAccessToken(config, token);
    expect(claims.sub).toBe('user-admin');
    expect(claims.roles).toContain('admin');
  });

  it('rejects an alg=none (unsigned) token', () => {
    const forged = jwt.sign(
      { sub: 'user-admin', roles: ['admin'], iss: config.jwt.issuer, aud: config.jwt.audience },
      '',
      { algorithm: 'none' },
    );
    expect(() => verifyAccessToken(config, forged)).toThrow(AppError);
  });

  it('rejects an HS256-signed token (algorithm downgrade)', () => {
    const forged = jwt.sign({ sub: 'user-admin', roles: ['admin'] }, 'public-is-not-secret', {
      algorithm: 'HS256',
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      expiresIn: 60,
    });
    expect(() => verifyAccessToken(config, forged)).toThrow(/Invalid or expired token/);
  });

  it('rejects a token signed by a different (attacker) RS256 key', () => {
    const { privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const forged = jwt.sign({ sub: 'user-admin', roles: ['admin'] }, privateKey, {
      algorithm: 'RS256',
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      expiresIn: 60,
    });
    expect(() => verifyAccessToken(config, forged)).toThrow(AppError);
  });

  it('rejects a wrong issuer', () => {
    const token = jwt.sign({ sub: 'x', roles: [] }, config.jwt.privateKeyPem, {
      algorithm: 'RS256',
      issuer: 'https://evil.example.com/',
      audience: config.jwt.audience,
      expiresIn: 60,
    });
    expect(() => verifyAccessToken(config, token)).toThrow(AppError);
  });

  it('rejects a wrong audience', () => {
    const token = jwt.sign({ sub: 'x', roles: [] }, config.jwt.privateKeyPem, {
      algorithm: 'RS256',
      issuer: config.jwt.issuer,
      audience: 'some-other-api',
      expiresIn: 60,
    });
    expect(() => verifyAccessToken(config, token)).toThrow(AppError);
  });

  it('rejects an expired token', () => {
    const token = jwt.sign({ sub: 'x', roles: [] }, config.jwt.privateKeyPem, {
      algorithm: 'RS256',
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      expiresIn: -10,
    });
    expect(() => verifyAccessToken(config, token)).toThrow(AppError);
  });
});
