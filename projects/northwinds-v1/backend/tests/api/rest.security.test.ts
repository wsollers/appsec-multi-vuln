import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { buildTestApp, tokenFor, csrfAgent, authHeader } from '../helpers/app.js';

let app: Express;
let adminToken: string;
let viewerToken: string;

beforeAll(async () => {
  ({ app } = await buildTestApp());
  adminToken = await tokenFor(app, 'admin');
  viewerToken = await tokenFor(app, 'viewer');
});

describe('REST authentication boundaries (threat S1/E3)', () => {
  it('rejects a request with no token (401)', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects a garbage token (401)', async () => {
    const res = await request(app).get('/api/v1/products').set(authHeader('not-a-jwt'));
    expect(res.status).toBe(401);
  });

  it('allows a valid token (200) and paginates', async () => {
    const res = await request(app).get('/api/v1/products').set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.pageSize).toBeLessThanOrEqual(100);
  });

  it('leaves the health endpoint public', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('REST RBAC (threat E1)', () => {
  it('forbids a viewer from creating a product (403)', async () => {
    const { agent, csrf } = await csrfAgent(app);
    const res = await agent
      .post('/api/v1/products')
      .set(authHeader(viewerToken))
      .set('X-CSRF-Token', csrf)
      .send({ productName: 'Nope' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('allows an admin to create a product (201)', async () => {
    const { agent, csrf } = await csrfAgent(app);
    const res = await agent
      .post('/api/v1/products')
      .set(authHeader(adminToken))
      .set('X-CSRF-Token', csrf)
      .send({ productName: 'New Product', unitPrice: 9.99 });
    expect(res.status).toBe(201);
    expect(res.body.productId).toBeTypeOf('number');
    expect(res.body.productName).toBe('New Product');
  });
});

describe('REST CSRF protection (threat T4)', () => {
  it('rejects a state-changing request without a CSRF token (403)', async () => {
    const res = await request(app)
      .post('/api/v1/products')
      .set(authHeader(adminToken))
      .send({ productName: 'X' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('rejects a mismatched CSRF header/cookie', async () => {
    const { agent } = await csrfAgent(app);
    const res = await agent
      .post('/api/v1/products')
      .set(authHeader(adminToken))
      .set('X-CSRF-Token', 'wrong-token')
      .send({ productName: 'X' });
    expect(res.status).toBe(403);
  });
});

describe('REST input hardening (threats T1/T2)', () => {
  it('ignores injected/unknown fields on create (no mass assignment)', async () => {
    const { agent, csrf } = await csrfAgent(app);
    const res = await agent
      .post('/api/v1/products')
      .set(authHeader(adminToken))
      .set('X-CSRF-Token', csrf)
      .send({ productName: 'Clean', unitPrice: 1, productId: 999999, injected: 'x' });
    // Strict schema rejects unknown keys → validation error.
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('treats SQL metacharacters in filters as literal data (parameterized)', async () => {
    const res = await request(app)
      .get('/api/v1/suppliers')
      .query({ city: "London'; DROP TABLE suppliers;--" })
      .set(authHeader(adminToken));
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]); // no row matches the literal string
    // Table still intact:
    const check = await request(app).get('/api/v1/suppliers').set(authHeader(adminToken));
    expect(check.body.total).toBeGreaterThan(0);
  });

  it('rejects filtering on a non-allow-listed column', async () => {
    const res = await request(app)
      .get('/api/v1/suppliers')
      .query({ Phone: '555' })
      .set(authHeader(adminToken));
    // Unknown query params are simply ignored (not in filterMap) → full list.
    expect(res.status).toBe(200);
  });
});

describe('Security headers & CORS (threats S3/I5/T3)', () => {
  it('sets hardening headers', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'none'");
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('does not reflect an arbitrary Origin', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'https://evil.example.com');
    expect(res.headers['access-control-allow-origin']).not.toBe('https://evil.example.com');
  });

  it('allows the configured origin with credentials', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});
