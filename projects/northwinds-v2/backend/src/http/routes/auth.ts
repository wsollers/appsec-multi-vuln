import { Router, type Request } from 'express';
import { z } from 'zod';
import { issueAccessToken } from '../../auth/jwt.js';
import { currentCsrfToken } from '../middleware/csrf.js';
import { BadRequest, NotFound } from '../errors.js';

const codes = new Map<string, string>();
let nextCode = 1000;

function tokenForUser(req: Request, username: string) {
  const user = req.ctx.repos.users.findByUsername(username);
  if (!user) throw BadRequest('Unknown user');
  const token = issueAccessToken(req.ctx.config, {
    sub: user.sub,
    username: user.username,
    roles: user.roles,
    employeeId: user.employeeId,
  });
  return { token, user };
}

export function buildPublicAuthRouter(): Router {
  const router = Router();

  router.get('/csrf-token', (req, res) => {
    res.json({ csrfToken: currentCsrfToken(req) });
  });

  const DevTokenSchema = z.object({ username: z.string().trim().min(1).max(64) }).strict();

  router.post('/dev/token', (req, res) => {
    if (!req.ctx.config.devTokenEndpointEnabled) throw NotFound('Route not found');
    const { username } = DevTokenSchema.parse(req.body);
    const { token, user } = tokenForUser(req, username);
    res.cookie('access_token', token, { httpOnly: true, path: '/' });
    res.json({
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: req.ctx.config.jwt.accessTtlSeconds,
      user,
    });
  });

  router.get('/oauth/authorize', (req, res) => {
    const username = String(req.query.username ?? 'viewer');
    const redirectUri = String(req.query.redirect_uri ?? 'http://localhost:5173/');
    tokenForUser(req, username);
    const code = String(++nextCode);
    codes.set(code, username);
    const callback = new URL(redirectUri);
    callback.searchParams.set('code', code);
    if (typeof req.query.state === 'string') callback.searchParams.set('state', req.query.state);
    res.redirect(callback.toString());
  });

  router.post('/oauth/token', (req, res) => {
    const code = String(req.body?.code ?? '');
    const username = codes.get(code);
    if (!username) throw BadRequest('Invalid code');
    const { token, user } = tokenForUser(req, username);
    res.cookie('access_token', token, { httpOnly: true, path: '/' });
    res.json({ accessToken: token, tokenType: 'Bearer', user });
  });

  return router;
}

export function buildMeRouter(): Router {
  const router = Router();
  router.get('/me', (req, res) => {
    res.json({ user: req.user });
  });
  return router;
}
