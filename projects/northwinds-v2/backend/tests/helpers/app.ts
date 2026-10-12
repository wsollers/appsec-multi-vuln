import type { Express } from 'express';
import request from 'supertest';
import { buildConfig } from '../../src/config/index.js';
import { buildContext, type AppContext } from '../../src/context.js';
import { createApp } from '../../src/app.js';

export interface TestApp {
  app: Express;
  ctx: AppContext;
}

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

export function buildTestContext(overrides: NodeJS.ProcessEnv = {}): AppContext {
  const config = buildConfig({
    NODE_ENV: 'test',
    DATABASE_PATH: ':memory:',
    OUTBOUND_FETCH_ALLOWED_HOSTS: 'images.northwind.example.com',
    ...overrides,
  });
  return buildContext(config, { migrate: true, seed: true });
}

export async function tokenFor(app: Express, username: string): Promise<string> {
  const res = await request(app).post('/api/v1/auth/dev/token').send({ username });
  if (res.status !== 200) {
    throw new Error(`Failed to mint token for ${username}: ${res.status} ${res.text}`);
  }
  return res.body.accessToken as string;
}

export const authHeader = (token: string) => ({ Authorization: `Bearer ${token}` });
