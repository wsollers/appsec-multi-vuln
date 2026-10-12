import { Router } from 'express';
import { z } from 'zod';
import { issueAccessToken } from '../../auth/jwt.js';
import { currentCsrfToken } from '../middleware/csrf.js';
import { BadRequest, NotFound } from '../errors.js';

/**
 * PUBLIC auth-adjacent endpoints (no bearer token required):
 *
 *  - GET  /csrf-token      → returns the current anti-CSRF token for the SPA.
 *  - POST /dev/token       → DEV/TEST ONLY mint that stands in for the external
 *                            OIDC provider. Force-disabled in production.
 */
export function buildPublicAuthRouter(): Router {
  const router = Router();

  router.get('/csrf-token', (req, res) => {
    res.json({ csrfToken: currentCsrfToken(req) });
  });

  const DevTokenSchema = z.object({ username: z.string().trim().min(1).max(64) }).strict();

  router.post('/dev/token', (req, res) => {
    if (!req.ctx.config.devTokenEndpointEnabled) {
      throw NotFound('Route not found');
    }
    const { username } = DevTokenSchema.parse(req.body);
    const user = req.ctx.repos.users.findByUsername(username);
    if (!user) {
      throw BadRequest('Unknown development user');
    }
    const token = issueAccessToken(req.ctx.config, {
      sub: user.sub,
      username: user.username,
      roles: user.roles,
      employeeId: user.employeeId,
    });
    res.json({
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: req.ctx.config.jwt.accessTtlSeconds,
      user,
    });
  });

  return router;
}

/** PROTECTED endpoint returning the authenticated principal (mounted behind `authenticate`). */
export function buildMeRouter(): Router {
  const router = Router();
  router.get('/me', (req, res) => {
    res.json({ user: req.user });
  });
  return router;
}
