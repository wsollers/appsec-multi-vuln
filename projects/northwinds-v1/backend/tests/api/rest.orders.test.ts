import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { buildTestApp, tokenFor, csrfAgent, authHeader } from '../helpers/app.js';

let app: Express;
let aliceToken: string; // employee 1
let bobToken: string; // employee 3
let adminToken: string;

beforeAll(async () => {
  ({ app } = await buildTestApp());
  aliceToken = await tokenFor(app, 'sales_alice');
  bobToken = await tokenFor(app, 'sales_bob');
  adminToken = await tokenFor(app, 'admin');
});

describe('REST object-level authorization on orders (threat I1/IDOR)', () => {
  it('a sales user can fetch their own order', async () => {
    const res = await request(app).get('/api/v1/orders/10248').set(authHeader(aliceToken));
    expect(res.status).toBe(200);
    expect(res.body.order.orderId).toBe(10248);
    expect(Array.isArray(res.body.details)).toBe(true);
  });

  it("a sales user is forbidden from another employee's order (403)", async () => {
    // Order 10248 belongs to employee 1 (alice); bob is employee 3.
    const res = await request(app).get('/api/v1/orders/10248').set(authHeader(bobToken));
    expect(res.status).toBe(403);
  });

  it('list is scoped to the caller’s own orders for sales users', async () => {
    const res = await request(app).get('/api/v1/orders?pageSize=100').set(authHeader(aliceToken));
    expect(res.status).toBe(200);
    expect(res.body.items.every((o: { employeeId: number }) => o.employeeId === 1)).toBe(true);
  });

  it('admin sees all orders', async () => {
    const res = await request(app).get('/api/v1/orders?pageSize=100').set(authHeader(adminToken));
    const ids = new Set(res.body.items.map((o: { employeeId: number }) => o.employeeId));
    expect(ids.size).toBeGreaterThan(1);
  });

  it('a sales user cannot delete another employee’s order', async () => {
    const { agent, csrf } = await csrfAgent(app);
    const res = await agent
      .delete('/api/v1/orders/10248')
      .set(authHeader(bobToken))
      .set('X-CSRF-Token', csrf);
    expect(res.status).toBe(403);
  });

  it('creates an order with line items transactionally', async () => {
    const { agent, csrf } = await csrfAgent(app);
    const res = await agent
      .post('/api/v1/orders')
      .set(authHeader(aliceToken))
      .set('X-CSRF-Token', csrf)
      .send({
        customerId: 'ALFKI',
        orderDate: '2024-03-03',
        freight: 12.5,
        shipName: 'Alfreds',
        shipCity: 'Berlin',
        shipCountry: 'Germany',
        details: [{ productId: 1, unitPrice: 18, quantity: 3, discount: 0 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.employeeId).toBe(1); // forced to the creating sales user
  });
});
