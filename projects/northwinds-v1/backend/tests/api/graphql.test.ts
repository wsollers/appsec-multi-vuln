import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { buildTestApp, tokenFor, authHeader } from '../helpers/app.js';

let app: Express;
let adminToken: string;
let viewerToken: string;
let bobToken: string;

const gql = (app: Express, token: string | null, body: object) => {
  const req = request(app).post('/graphql').set('Content-Type', 'application/json');
  if (token) req.set(authHeader(token));
  return req.send(body);
};

beforeAll(async () => {
  ({ app } = await buildTestApp());
  adminToken = await tokenFor(app, 'admin');
  viewerToken = await tokenFor(app, 'viewer');
  bobToken = await tokenFor(app, 'sales_bob');
});

describe('GraphQL authentication (threat S1/E3)', () => {
  it('rejects an unauthenticated query (401)', async () => {
    const res = await gql(app, null, { query: '{ products { items { productId } } }' });
    expect(res.status).toBe(401);
  });

  it('allows an authenticated query', async () => {
    const res = await gql(app, adminToken, { query: '{ products { items { productId productName } } }' });
    expect(res.status).toBe(200);
    expect(res.body.data.products.items.length).toBeGreaterThan(0);
  });
});

describe('GraphQL RBAC & object-level authz (threats E1/I1)', () => {
  it('forbids a viewer from a write mutation', async () => {
    const res = await gql(app, viewerToken, {
      query: 'mutation { createProduct(input: { productName: "X" }) { productId } }',
    });
    expect(res.body.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
  });

  it("forbids a sales user from another employee's order", async () => {
    // Order 10248 belongs to employee 1; bob is employee 3.
    const res = await gql(app, bobToken, { query: '{ order(id: 10248) { orderId } }' });
    expect(res.body.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
  });

  it('allows admin to create and delete a product', async () => {
    const create = await gql(app, adminToken, {
      query: 'mutation { createProduct(input: { productName: "GQL Widget", unitPrice: 2.5 }) { productId productName } }',
    });
    expect(create.body.data.createProduct.productName).toBe('GQL Widget');
    const id = create.body.data.createProduct.productId;
    const del = await gql(app, adminToken, { query: `mutation { deleteProduct(id: ${id}) }` });
    expect(del.body.data.deleteProduct).toBe(true);
  });
});

describe('GraphQL hardening (threats D1/I3)', () => {
  it('enforces a query depth limit', async () => {
    const { app: shallow } = await buildTestApp({ GRAPHQL_MAX_DEPTH: '1' });
    const token = await tokenFor(shallow, 'admin');
    const res = await gql(shallow, token, {
      query: '{ order(id: 10248) { orderId details { productId } } }',
    });
    expect(res.body.errors?.[0]?.message).toMatch(/maximum depth/i);
  });

  it('enforces a complexity limit', async () => {
    const { app: tiny } = await buildTestApp({ GRAPHQL_MAX_COMPLEXITY: '2' });
    const token = await tokenFor(tiny, 'admin');
    const res = await gql(tiny, token, {
      query: '{ products { items { productId productName unitPrice categoryId } } }',
    });
    expect(res.body.errors?.[0]?.message).toMatch(/too complex/i);
  });

  it('has introspection enabled outside production', async () => {
    const res = await gql(app, adminToken, { query: '{ __schema { queryType { name } } }' });
    expect(res.body.data.__schema.queryType.name).toBe('Query');
  });

  it('disables introspection in a production profile', async () => {
    const { generateKeyPairSync } = await import('node:crypto');
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const { buildConfig } = await import('../../src/config/index.js');
    const prod = buildConfig({
      NODE_ENV: 'production',
      JWT_PRIVATE_KEY: privateKey,
      JWT_PUBLIC_KEY: publicKey,
    });
    expect(prod.graphql.introspection).toBe(false);
    expect(prod.devTokenEndpointEnabled).toBe(false);
  });
});
