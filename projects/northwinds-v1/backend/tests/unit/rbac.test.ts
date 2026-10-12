import { describe, it, expect } from 'vitest';
import { hasPermission, isAdmin } from '../../src/auth/rbac.js';
import type { AuthenticatedUser } from '../../src/domain/types.js';

const viewer: AuthenticatedUser = { sub: 'v', username: 'v', roles: ['viewer'], employeeId: null };
const sales: AuthenticatedUser = { sub: 's', username: 's', roles: ['sales'], employeeId: 1 };
const admin: AuthenticatedUser = { sub: 'a', username: 'a', roles: ['admin'], employeeId: null };

describe('RBAC permission matrix (threats E1/E3)', () => {
  it('viewer can read but not write any resource', () => {
    expect(hasPermission(viewer, 'products:read')).toBe(true);
    expect(hasPermission(viewer, 'orders:read')).toBe(true);
    expect(hasPermission(viewer, 'products:write')).toBe(false);
    expect(hasPermission(viewer, 'orders:write')).toBe(false);
  });

  it('sales can write orders and customers but not products or categories', () => {
    expect(hasPermission(sales, 'orders:write')).toBe(true);
    expect(hasPermission(sales, 'customers:write')).toBe(true);
    expect(hasPermission(sales, 'products:write')).toBe(false);
    expect(hasPermission(sales, 'categories:write')).toBe(false);
  });

  it('admin can write everything', () => {
    for (const r of ['categories', 'products', 'orders', 'employees', 'shippers'] as const) {
      expect(hasPermission(admin, `${r}:write`)).toBe(true);
    }
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(sales)).toBe(false);
  });

  it('is deny-by-default for a user with no roles', () => {
    const none: AuthenticatedUser = { sub: 'n', username: 'n', roles: [], employeeId: null };
    expect(hasPermission(none, 'products:read')).toBe(false);
    expect(hasPermission(none, 'products:write')).toBe(false);
  });
});
