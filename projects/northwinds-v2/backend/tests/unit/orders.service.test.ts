import { describe, it, expect, beforeEach } from 'vitest';
import { buildTestContext } from '../helpers/app.js';
import type { AppContext } from '../../src/context.js';
import type { AuthenticatedUser } from '../../src/domain/types.js';

let ctx: AppContext;
const admin = () => ctx.repos.users.findBySub('user-admin') as AuthenticatedUser;

beforeEach(() => {
  ctx = buildTestContext();
});

describe('OrdersService', () => {
  it('returns an order with its details', () => {
    const result = ctx.services.orders.get(admin(), 10248);
    expect(result.order.orderId).toBe(10248);
    expect(result.details.length).toBeGreaterThan(0);
  });

  it('lists seeded orders', () => {
    const page = ctx.services.orders.list(admin(), { page: 1, pageSize: 25 });
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.total).toBeGreaterThan(0);
  });

  it('creates an order and its line items', () => {
    const created = ctx.services.orders.create(admin(), {
      order: {
        customerId: 'ALFKI',
        employeeId: 2,
        orderDate: '2024-02-02',
        requiredDate: null,
        shippedDate: null,
        shipVia: 1,
        freight: 5,
        shipName: 'Sample',
        shipCity: 'Berlin',
        shipCountry: 'Germany',
      },
      details: [
        { productId: 1, unitPrice: 18, quantity: 2, discount: 0 },
        { productId: 2, unitPrice: 19, quantity: 1, discount: 0.1 },
      ],
    });
    expect(ctx.repos.orders.findDetails(created.orderId)).toHaveLength(2);
  });
});
