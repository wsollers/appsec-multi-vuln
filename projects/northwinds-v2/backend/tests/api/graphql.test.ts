import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { buildTestApp, tokenFor, authHeader } from '../helpers/app.js';

let app: Express;
let token: string;

beforeAll(async () => {
  ({ app } = await buildTestApp());
  token = await tokenFor(app, 'admin');
});

describe('GraphQL catalog', () => {
  it('lists products', async () => {
    const res = await request(app)
      .post('/graphql')
      .set(authHeader(token))
      .send({ query: '{ products { items { productId productName } } }' });
    expect(res.status).toBe(200);
    expect(res.body.data.products.items.length).toBeGreaterThan(0);
  });

  it('creates and deletes a product', async () => {
    const create = await request(app).post('/graphql').set(authHeader(token)).send({
      query:
        'mutation { createProduct(input: { productName: "GQL Widget", unitPrice: 2.5 }) { productId productName } }',
    });
    expect(create.body.data.createProduct.productName).toBe('GQL Widget');
    const id = create.body.data.createProduct.productId;
    const remove = await request(app)
      .post('/graphql')
      .set(authHeader(token))
      .send({ query: `mutation { deleteProduct(id: ${id}) }` });
    expect(remove.body.data.deleteProduct).toBe(true);
  });
});
