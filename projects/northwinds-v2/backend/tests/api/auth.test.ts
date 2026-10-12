import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { buildTestApp, tokenFor, authHeader } from '../helpers/app.js';

let app: Express;

beforeAll(async () => {
  ({ app } = await buildTestApp());
});

describe('API entry points', () => {
  it('signs in a sample user', async () => {
    const token = await tokenFor(app, 'viewer');
    const me = await request(app).get('/api/v1/auth/me').set(authHeader(token));
    expect(me.status).toBe(200);
    expect(me.body.user.username).toBe('viewer');
  });

  it('exchanges an authorization code', async () => {
    const authorization = await request(app)
      .get('/api/v1/auth/oauth/authorize')
      .query({
        username: 'admin',
        redirect_uri: 'http://localhost:5173/callback',
        state: 'sample',
      });
    expect(authorization.status).toBe(302);
    const location = new URL(authorization.headers.location);
    const code = location.searchParams.get('code');
    const token = await request(app).post('/api/v1/auth/oauth/token').send({ code });
    expect(token.status).toBe(200);
    expect(token.body.accessToken).toBeTypeOf('string');
  });

  it('serves the API description', async () => {
    const res = await request(app).get('/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Swagger UI');
  });
});
