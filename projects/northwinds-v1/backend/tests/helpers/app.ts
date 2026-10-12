import type { Express } from 'express';
import TestAgent from 'supertest/lib/agent.js';
import request from 'supertest';
import { buildConfig } from '../../src/config/index.js';
import { buildContext, type AppContext } from '../../src/context.js';
import { createApp } from '../../src/app.js';

export interface TestApp {
  app: Express;
  ctx: AppContext;
}

/** Builds an isolated app backed by an in-memory, freshly-seeded SQLite DB. */
export async function buildTestApp(overrides: NodeJS.ProcessEnv = {}): Promise<TestApp> {
  const config = buildConfig({
    NODE_ENV: 'test',
    DATABASE_PATH: ':memory:',
    CORS_ALLOWED_ORIGINS: 'http://localhost:5173',
    ENABLE_DEV_TOKEN_ENDPOINT: 'true',
    OUTBOUND_FETCH_ALLOWED_HOSTS: 'images.northwind.example.com',
    ...overrides,
  });
  const ctx = buildContext(config, { migrate: true, seed: true });
  const app = await createApp(ctx);
  return { app, ctx };
}

/** Builds an isolated, seeded context without the Express/Apollo layer. */
export function buildTestContext(overrides: NodeJS.ProcessEnv = {}): AppContext {
  const config = buildConfig({
    NODE_ENV: 'test',
    DATABASE_PATH: ':memory:',
    OUTBOUND_FETCH_ALLOWED_HOSTS: 'images.northwind.example.com',
    ...overrides,
  });
  return buildContext(config, { migrate: true, seed: true });
}

/** Mints an access token for a seeded user via the dev token endpoint. */
export async function tokenFor(app: Express, username: string): Promise<string> {
  const res = await request(app).post('/api/v1/auth/dev/token').send({ username });
  if (res.status !== 200) {
    throw new Error(`Failed to mint token for ${username}: ${res.status} ${res.text}`);
  }
  return res.body.accessToken as string;
}

/**
 * Returns a cookie-persisting agent plus a valid CSRF token, so mutating
 * requests can satisfy the double-submit check.
 */
export async function csrfAgent(app: Express): Promise<{ agent: TestAgent; csrf: string }> {
  const agent = request.agent(app);
  const res = await agent.get('/api/v1/auth/csrf-token');
  return { agent, csrf: res.body.csrfToken as string };
}

export const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });
