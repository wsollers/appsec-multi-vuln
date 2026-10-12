import type {
  OrderDetailWriteFields,
  OrderWriteFields,
  OrdersRepository,
} from '../repositories/orders.repository.js';
import type { AuthenticatedUser, Order, OrderDetail, Paginated, PageRequest } from '../domain/types.js';
import { NotFound } from '../http/errors.js';

export interface CreateOrderInput {
  order: OrderWriteFields;
  details: OrderDetailWriteFields[];
}

/** Coordinates order and line-item operations. */
export class OrdersService {
  constructor(private readonly repo: OrdersRepository) {}

  list(_user: AuthenticatedUser, page: PageRequest, customerId?: string): Paginated<Order> {
    return this.repo.list({
      page,
      ...(customerId !== undefined ? { customerId } : {}),
    });
  }

  get(_user: AuthenticatedUser, orderId: number): { order: Order; details: OrderDetail[] } {
    const order = this.repo.findById(orderId);
    if (!order) throw NotFound('Order not found');
    return { order, details: this.repo.findDetails(orderId) };
  }

  listDetails(_user: AuthenticatedUser, orderId: number, page: PageRequest): Paginated<OrderDetail> {
    if (!this.repo.findById(orderId)) throw NotFound('Order not found');
    return this.repo.listDetails(orderId, page);
  }

  getDetail(_user: AuthenticatedUser, orderId: number, productId: number): OrderDetail {
    const detail = this.repo.findDetail(orderId, productId);
    if (!detail) throw NotFound('Order detail not found');
    return detail;
  }

  createDetail(
    _user: AuthenticatedUser,
    orderId: number,
    fields: OrderDetailWriteFields,
  ): OrderDetail {
    if (!this.repo.findById(orderId)) throw NotFound('Order not found');
    return this.repo.createDetail(orderId, fields);
  }

  updateDetail(
    _user: AuthenticatedUser,
    orderId: number,
    productId: number,
    fields: Partial<Omit<OrderDetailWriteFields, 'productId'>>,
  ): OrderDetail {
    const detail = this.repo.updateDetail(orderId, productId, fields);
    if (!detail) throw NotFound('Order detail not found');
    return detail;
  }

  removeDetail(_user: AuthenticatedUser, orderId: number, productId: number): void {
    if (!this.repo.deleteDetail(orderId, productId)) throw NotFound('Order detail not found');
  }

  create(_user: AuthenticatedUser, input: CreateOrderInput): Order {
    return this.repo.createWithDetails(input.order, input.details);
  }

  update(_user: AuthenticatedUser, orderId: number, fields: Partial<OrderWriteFields>): Order {
    const existing = this.repo.findById(orderId);
    if (!existing) throw NotFound('Order not found');
    const updated = this.repo.update(orderId, fields);
    if (!updated) throw NotFound('Order not found');
    return updated;
  }

  remove(_user: AuthenticatedUser, orderId: number): void {
    const existing = this.repo.findById(orderId);
    if (!existing) throw NotFound('Order not found');
    this.repo.delete(orderId);
  }
}
