import { describe, it, expect, beforeEach } from 'vitest';
import { buildTestContext } from '../helpers/app.js';
import type { AppContext } from '../../src/context.js';
import type { AuthenticatedUser } from '../../src/domain/types.js';
import { AppError } from '../../src/http/errors.js';

let ctx: AppContext;
const alice = () => ctx.repos.users.findBySub('user-alice') as AuthenticatedUser; // employeeId 1
const bob = () => ctx.repos.users.findBySub('user-bob') as AuthenticatedUser; // employeeId 3
const admin = () => ctx.repos.users.findBySub('user-admin') as AuthenticatedUser;

beforeEach(() => {
  ctx = buildTestContext();
});

describe('OrdersService object-level authorization (threat I1/IDOR)', () => {
  it('a sales user can read their own order', () => {
    // Order 10248 has EmployeeID 1 (alice).
    const { order } = ctx.services.orders.get(alice(), 10248);
    expect(order.orderId).toBe(10248);
    expect(order.employeeId).toBe(1);
  });

  it("a sales user cannot read another employee's order (403, not 404)", () => {
    // Order 10248 belongs to employee 1 (alice), not bob (employee 3).
    try {
      ctx.services.orders.get(bob(), 10248);
      throw new Error('expected forbidden');
    } catch (err) {
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).status).toBe(403);
    }
  });

  it('an admin can read any order', () => {
    const { order } = ctx.services.orders.get(admin(), 10248);
    expect(order.orderId).toBe(10248);
  });

  it('list is scoped to the sales user’s own employee id', () => {
    const page = ctx.services.orders.list(alice(), { page: 1, pageSize: 100 });
    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items.every((o) => o.employeeId === 1)).toBe(true);
  });

  it('admin list is not scoped', () => {
    const page = ctx.services.orders.list(admin(), { page: 1, pageSize: 100 });
    const employeeIds = new Set(page.items.map((o) => o.employeeId));
    expect(employeeIds.size).toBeGreaterThan(1);
  });

  it('a sales user cannot delete another employee’s order', () => {
    expect(() => ctx.services.orders.remove(bob(), 10248)).toThrow(AppError);
    // The order still exists.
    expect(ctx.repos.orders.findById(10248)).not.toBeNull();
  });

  it('rejects a sales user assigning a new order to another employee', () => {
    expect(() =>
      ctx.services.orders.create(alice(), {
        order: {
          customerId: 'ALFKI',
          employeeId: 3, // attempt to assign to bob
          orderDate: '2024-01-01',
          requiredDate: null,
          shippedDate: null,
          shipVia: 1,
          freight: 10,
          shipName: 'X',
          shipCity: 'Y',
          shipCountry: 'Z',
        },
        details: [{ productId: 1, unitPrice: 18, quantity: 2, discount: 0 }],
      }),
    ).toThrow(AppError);
  });

  it('defaults a sales-created order (no employeeId) to the creator’s own id', () => {
    const created = ctx.services.orders.create(alice(), {
      order: {
        customerId: 'ALFKI',
        employeeId: null, // omitted → coerced to alice (employee 1)
        orderDate: '2024-01-01',
        requiredDate: null,
        shippedDate: null,
        shipVia: 1,
        freight: 10,
        shipName: 'X',
        shipCity: 'Y',
        shipCountry: 'Z',
      },
      details: [{ productId: 1, unitPrice: 18, quantity: 2, discount: 0 }],
    });
    expect(created.employeeId).toBe(1);
  });

  it('creates an order and its line items atomically', () => {
    const created = ctx.services.orders.create(admin(), {
      order: {
        customerId: 'ALFKI',
        employeeId: 2,
        orderDate: '2024-02-02',
        requiredDate: null,
        shippedDate: null,
        shipVia: 1,
        freight: 5,
        shipName: 'X',
        shipCity: 'Y',
        shipCountry: 'Z',
      },
      details: [
        { productId: 1, unitPrice: 18, quantity: 2, discount: 0 },
        { productId: 2, unitPrice: 19, quantity: 1, discount: 0.1 },
      ],
    });
    const details = ctx.repos.orders.findDetails(created.orderId);
    expect(details).toHaveLength(2);
  });
});
