import type {
  OrderDetailWriteFields,
  OrderWriteFields,
  OrdersRepository,
} from '../repositories/orders.repository.js';
import type { AuthenticatedUser, Order, OrderDetail, Paginated, PageRequest } from '../domain/types.js';
import { Forbidden, NotFound } from '../http/errors.js';
import { isAdmin } from '../auth/rbac.js';

export interface CreateOrderInput {
  order: OrderWriteFields;
  details: OrderDetailWriteFields[];
}

/**
 * Orders service enforcing OBJECT-LEVEL authorization (design §6, threats I1/
 * IDOR). A `sales` user may only read or mutate orders tied to their own
 * employee id; an `admin` may act on any order. Knowing an order id is never
 * sufficient to reach it.
 */
export class OrdersService {
  constructor(private readonly repo: OrdersRepository) {}

  private canAccess(user: AuthenticatedUser, order: Order): boolean {
    if (isAdmin(user)) return true;
    if (user.employeeId === null) return false;
    return order.employeeId === user.employeeId;
  }

  list(user: AuthenticatedUser, page: PageRequest, customerId?: string): Paginated<Order> {
    // Sales users are scoped server-side to their own employee's orders.
    const employeeIdScope = isAdmin(user) ? null : user.employeeId;
    return this.repo.list({
      page,
      employeeIdScope,
      ...(customerId !== undefined ? { customerId } : {}),
    });
  }

  get(user: AuthenticatedUser, orderId: number): { order: Order; details: OrderDetail[] } {
    const order = this.repo.findById(orderId);
    if (!order) throw NotFound('Order not found');
    // Object-level check: deny rather than leak existence differences beyond 403.
    if (!this.canAccess(user, order)) throw Forbidden('You cannot access this order');
    return { order, details: this.repo.findDetails(orderId) };
  }

  create(user: AuthenticatedUser, input: CreateOrderInput): Order {
    // A sales user may only create orders owned by their own employee id.
    if (!isAdmin(user)) {
      if (user.employeeId === null) {
        throw Forbidden('Your account is not permitted to create orders');
      }
      if (input.order.employeeId !== null && input.order.employeeId !== user.employeeId) {
        throw Forbidden('You cannot create an order for another employee');
      }
      input.order.employeeId = user.employeeId;
    }
    return this.repo.createWithDetails(input.order, input.details);
  }

  update(user: AuthenticatedUser, orderId: number, fields: Partial<OrderWriteFields>): Order {
    const existing = this.repo.findById(orderId);
    if (!existing) throw NotFound('Order not found');
    if (!this.canAccess(user, existing)) throw Forbidden('You cannot modify this order');
    // A sales user cannot reassign an order to a different employee.
    if (!isAdmin(user) && fields.employeeId !== undefined && fields.employeeId !== user.employeeId) {
      throw Forbidden('You cannot reassign this order to another employee');
    }
    const updated = this.repo.update(orderId, fields);
    if (!updated) throw NotFound('Order not found');
    return updated;
  }

  remove(user: AuthenticatedUser, orderId: number): void {
    const existing = this.repo.findById(orderId);
    if (!existing) throw NotFound('Order not found');
    if (!this.canAccess(user, existing)) throw Forbidden('You cannot delete this order');
    this.repo.delete(orderId);
  }
}
