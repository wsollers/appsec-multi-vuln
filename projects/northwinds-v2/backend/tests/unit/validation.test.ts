import { describe, it, expect } from 'vitest';
import {
  ProductCreateSchema,
  CustomerCreateSchema,
  OrderCreateSchema,
} from '../../src/http/validators/entities.js';
import { PaginationSchema } from '../../src/http/validators/common.js';

describe('Request validation', () => {
  it('applies product defaults', () => {
    const result = ProductCreateSchema.parse({ productName: 'Widget' });
    expect(result.unitPrice).toBe(0);
    expect(result.discontinued).toBe(false);
  });

  it('accepts a customer record', () => {
    expect(
      CustomerCreateSchema.safeParse({ customerId: 'ABCDE', companyName: 'Example' }).success,
    ).toBe(true);
  });

  it('requires an order line', () => {
    expect(OrderCreateSchema.safeParse({ details: [] }).success).toBe(false);
    expect(
      OrderCreateSchema.safeParse({
        details: [{ productId: 1, unitPrice: 10, quantity: 2 }],
      }).success,
    ).toBe(true);
  });

  it('parses pagination defaults', () => {
    expect(PaginationSchema.parse({}).pageSize).toBe(25);
    expect(PaginationSchema.parse({ pageSize: '50' }).pageSize).toBe(50);
  });
});
