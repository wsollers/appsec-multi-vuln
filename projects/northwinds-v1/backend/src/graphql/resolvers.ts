import { GraphQLError } from 'graphql';
import type { AppContext } from '../context.js';
import type { AuthenticatedUser, PageRequest } from '../domain/types.js';
import { hasPermission, type Permission } from '../auth/rbac.js';
import { AppError } from '../http/errors.js';

export interface GraphQLContext {
  app: AppContext;
  user: AuthenticatedUser;
}

function clampPage(page: unknown, pageSize: unknown): PageRequest {
  const p = Math.max(1, Number(page) || 1);
  const size = Math.min(100, Math.max(1, Number(pageSize) || 25));
  return { page: p, pageSize: size };
}

/** Server-side RBAC gate for resolvers (threat E1/E3). */
function requirePermission(ctx: GraphQLContext, permission: Permission): void {
  if (!hasPermission(ctx.user, permission)) {
    throw new GraphQLError(`Missing permission: ${permission}`, {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

/** Translates domain AppErrors into GraphQL errors with a safe code. */
function wrap<T>(fn: () => T): T {
  try {
    return fn();
  } catch (err) {
    if (err instanceof AppError) {
      throw new GraphQLError(err.message, { extensions: { code: err.code } });
    }
    throw err;
  }
}

const toPage = <T>(result: { items: T[]; page: number; pageSize: number; total: number }) => ({
  items: result.items,
  pageInfo: { page: result.page, pageSize: result.pageSize, total: result.total },
});

export const resolvers = {
  Query: {
    categories: (_p: unknown, a: { page: number; pageSize: number }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'categories:read');
      return toPage(ctx.app.services.categories.list({ page: clampPage(a.page, a.pageSize) }));
    },
    category: (_p: unknown, a: { id: number }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'categories:read');
      return wrap(() => ctx.app.services.categories.get(a.id));
    },
    products: (
      _p: unknown,
      a: { page: number; pageSize: number; categoryId?: number },
      ctx: GraphQLContext,
    ) => {
      requirePermission(ctx, 'products:read');
      const filters = a.categoryId !== undefined ? { CategoryID: a.categoryId } : undefined;
      return toPage(
        ctx.app.services.products.list({
          page: clampPage(a.page, a.pageSize),
          ...(filters ? { filters } : {}),
        }),
      );
    },
    product: (_p: unknown, a: { id: number }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'products:read');
      return wrap(() => ctx.app.services.products.get(a.id));
    },
    customers: (_p: unknown, a: { page: number; pageSize: number }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'customers:read');
      return toPage(ctx.app.services.customers.list({ page: clampPage(a.page, a.pageSize) }));
    },
    customer: (_p: unknown, a: { id: string }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'customers:read');
      return wrap(() => ctx.app.services.customers.get(a.id));
    },
    suppliers: (_p: unknown, a: { page: number; pageSize: number }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'suppliers:read');
      return toPage(ctx.app.services.suppliers.list({ page: clampPage(a.page, a.pageSize) }));
    },
    employees: (_p: unknown, a: { page: number; pageSize: number }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'employees:read');
      return toPage(ctx.app.services.employees.list({ page: clampPage(a.page, a.pageSize) }));
    },
    shippers: (_p: unknown, a: { page: number; pageSize: number }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'shippers:read');
      return toPage(ctx.app.services.shippers.list({ page: clampPage(a.page, a.pageSize) }));
    },
    orders: (_p: unknown, a: { page: number; pageSize: number }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'orders:read');
      // Object-level scoping applied inside the service.
      return toPage(ctx.app.services.orders.list(ctx.user, clampPage(a.page, a.pageSize)));
    },
    order: (_p: unknown, a: { id: number }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'orders:read');
      return wrap(() => ctx.app.services.orders.get(ctx.user, a.id).order);
    },
  },

  Order: {
    // Field resolver loads details only when selected (and re-checks nothing
    // extra: access to the parent Order already passed the object-level check).
    details: (parent: { orderId: number }, _a: unknown, ctx: GraphQLContext) =>
      ctx.app.repos.orders.findDetails(parent.orderId),
  },

  Mutation: {
    createProduct: (_p: unknown, a: { input: Record<string, unknown> }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'products:write');
      return wrap(() =>
        ctx.app.services.products.create({
          ProductName: a.input.productName,
          SupplierID: a.input.supplierId ?? null,
          CategoryID: a.input.categoryId ?? null,
          UnitPrice: a.input.unitPrice ?? 0,
          UnitsInStock: a.input.unitsInStock ?? 0,
          Discontinued: a.input.discontinued ? 1 : 0,
        }),
      );
    },
    updateProduct: (
      _p: unknown,
      a: { id: number; input: Record<string, unknown> },
      ctx: GraphQLContext,
    ) => {
      requirePermission(ctx, 'products:write');
      const record: Record<string, unknown> = {};
      const map: Record<string, string> = {
        productName: 'ProductName',
        supplierId: 'SupplierID',
        categoryId: 'CategoryID',
        unitPrice: 'UnitPrice',
        unitsInStock: 'UnitsInStock',
        discontinued: 'Discontinued',
      };
      for (const [k, col] of Object.entries(map)) {
        if (k in a.input) {
          record[col] = k === 'discontinued' ? (a.input[k] ? 1 : 0) : a.input[k];
        }
      }
      return wrap(() => ctx.app.services.products.update(a.id, record));
    },
    deleteProduct: (_p: unknown, a: { id: number }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'products:write');
      return wrap(() => {
        ctx.app.services.products.remove(a.id);
        return true;
      });
    },
    createCategory: (_p: unknown, a: { input: Record<string, unknown> }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'categories:write');
      return wrap(() =>
        ctx.app.services.categories.create({
          CategoryName: a.input.categoryName,
          Description: a.input.description ?? null,
        }),
      );
    },
    createOrder: (
      _p: unknown,
      a: { input: Record<string, unknown> & { details: Record<string, unknown>[] } },
      ctx: GraphQLContext,
    ) => {
      requirePermission(ctx, 'orders:write');
      const i = a.input;
      return wrap(() =>
        ctx.app.services.orders.create(ctx.user, {
          order: {
            customerId: (i.customerId as string) ?? null,
            employeeId: (i.employeeId as number) ?? null,
            orderDate: (i.orderDate as string) ?? null,
            requiredDate: (i.requiredDate as string) ?? null,
            shippedDate: (i.shippedDate as string) ?? null,
            shipVia: (i.shipVia as number) ?? null,
            freight: (i.freight as number) ?? 0,
            shipName: (i.shipName as string) ?? null,
            shipCity: (i.shipCity as string) ?? null,
            shipCountry: (i.shipCountry as string) ?? null,
          },
          details: i.details.map((d) => ({
            productId: d.productId as number,
            unitPrice: d.unitPrice as number,
            quantity: d.quantity as number,
            discount: (d.discount as number) ?? 0,
          })),
        }),
      );
    },
    deleteOrder: (_p: unknown, a: { id: number }, ctx: GraphQLContext) => {
      requirePermission(ctx, 'orders:write');
      return wrap(() => {
        ctx.app.services.orders.remove(ctx.user, a.id);
        return true;
      });
    },
  },
};
