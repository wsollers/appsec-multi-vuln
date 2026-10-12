import { describe, it, expect } from 'vitest';
import {
  ProductCreateSchema,
  CustomerCreateSchema,
  OrderCreateSchema,
} from '../../src/http/validators/entities.js';
import { PaginationSchema } from '../../src/http/validators/common.js';

describe('Edge validation & mass-assignment protection (threat T2)', () => {
  it('rejects unknown fields on product create (strict allow-list)', () => {
    const r = ProductCreateSchema.safeParse({
      productName: 'Widget',
      unitPrice: 5,
      productId: 999, // server-owned, must be rejected
      isAdmin: true, // injected privilege field
    });
    expect(r.success).toBe(false);
  });

  it('accepts a clean product payload and applies defaults', () => {
    const r = ProductCreateSchema.safeParse({ productName: 'Widget' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.unitPrice).toBe(0);
      expect(r.data.discontinued).toBe(false);
    }
  });

  it('enforces the customer id format', () => {
    expect(CustomerCreateSchema.safeParse({ customerId: 'abc', companyName: 'X' }).success).toBe(
      false,
    );
    expect(
      CustomerCreateSchema.safeParse({ customerId: 'ABCDE', companyName: 'X' }).success,
    ).toBe(true);
  });

  it('requires at least one order line item', () => {
    expect(OrderCreateSchema.safeParse({ details: [] }).success).toBe(false);
    expect(
      OrderCreateSchema.safeParse({
        details: [{ productId: 1, unitPrice: 10, quantity: 2 }],
      }).success,
    ).toBe(true);
  });

  it('caps page size to a maximum of 100 (threat D2)', () => {
    expect(PaginationSchema.safeParse({ pageSize: '1000' }).success).toBe(false);
    expect(PaginationSchema.parse({ pageSize: '50' }).pageSize).toBe(50);
    expect(PaginationSchema.parse({}).pageSize).toBe(25);
  });
});
