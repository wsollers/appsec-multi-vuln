import type { DB } from '../db/connection.js';
import type { Order, OrderDetail, Paginated, PageRequest } from '../domain/types.js';
import { mapOrder, mapOrderDetail } from './mappers.js';

export interface OrderWriteFields {
  customerId: string | null;
  employeeId: number | null;
  orderDate: string | null;
  requiredDate: string | null;
  shippedDate: string | null;
  shipVia: number | null;
  freight: number;
  shipName: string | null;
  shipCity: string | null;
  shipCountry: string | null;
}

export interface OrderDetailWriteFields {
  productId: number;
  unitPrice: number;
  quantity: number;
  discount: number;
}

export interface OrderListOptions {
  page: PageRequest;
  /** Object-level scope: when set, only orders for this employee are returned. */
  employeeIdScope?: number | null;
  customerId?: string | undefined;
}

/**
 * Orders repository. All SQL is parameterized. Multi-table writes (order + its
 * line items) run inside a single transaction (design §8).
 */
export class OrdersRepository {
  constructor(private readonly db: DB) {}

  list(opts: OrderListOptions): Paginated<Order> {
    const parts: string[] = [];
    const params: unknown[] = [];
    if (opts.employeeIdScope !== undefined && opts.employeeIdScope !== null) {
      parts.push('EmployeeID = ?');
      params.push(opts.employeeIdScope);
    }
    if (opts.customerId !== undefined) {
      parts.push('CustomerID = ?');
      params.push(opts.customerId);
    }
    const where = parts.length ? `WHERE ${parts.join(' AND ')}` : '';
    const { page, pageSize } = opts.page;
    const offset = (page - 1) * pageSize;

    const total = (
      this.db.prepare(`SELECT COUNT(*) AS c FROM orders ${where}`).get(...params) as {
        c: number;
      }
    ).c;
    const rows = this.db
      .prepare(`SELECT * FROM orders ${where} ORDER BY OrderID ASC LIMIT ? OFFSET ?`)
      .all(...params, pageSize, offset) as Record<string, unknown>[];

    return { items: rows.map(mapOrder), page, pageSize, total };
  }

  findById(orderId: number): Order | null {
    const row = this.db.prepare('SELECT * FROM orders WHERE OrderID = ?').get(orderId) as
      | Record<string, unknown>
      | undefined;
    return row ? mapOrder(row) : null;
  }

  findDetails(orderId: number): OrderDetail[] {
    const rows = this.db
      .prepare('SELECT * FROM order_details WHERE OrderID = ? ORDER BY ProductID ASC')
      .all(orderId) as Record<string, unknown>[];
    return rows.map(mapOrderDetail);
  }

  /** Creates an order and its line items atomically. */
  createWithDetails(order: OrderWriteFields, details: OrderDetailWriteFields[]): Order {
    const tx = this.db.transaction(() => {
      const info = this.db
        .prepare(
          `INSERT INTO orders
            (CustomerID, EmployeeID, OrderDate, RequiredDate, ShippedDate, ShipVia, Freight, ShipName, ShipCity, ShipCountry)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          order.customerId,
          order.employeeId,
          order.orderDate,
          order.requiredDate,
          order.shippedDate,
          order.shipVia,
          order.freight,
          order.shipName,
          order.shipCity,
          order.shipCountry,
        );
      const orderId = Number(info.lastInsertRowid);
      const insDetail = this.db.prepare(
        `INSERT INTO order_details (OrderID, ProductID, UnitPrice, Quantity, Discount)
         VALUES (?, ?, ?, ?, ?)`,
      );
      for (const d of details) {
        insDetail.run(orderId, d.productId, d.unitPrice, d.quantity, d.discount);
      }
      return orderId;
    });
    const orderId = tx();
    const created = this.findById(orderId);
    if (!created) throw new Error('Order vanished after insert');
    return created;
  }

  update(orderId: number, fields: Partial<OrderWriteFields>): Order | null {
    const allowed: (keyof OrderWriteFields)[] = [
      'customerId',
      'employeeId',
      'orderDate',
      'requiredDate',
      'shippedDate',
      'shipVia',
      'freight',
      'shipName',
      'shipCity',
      'shipCountry',
    ];
    const columnMap: Record<keyof OrderWriteFields, string> = {
      customerId: 'CustomerID',
      employeeId: 'EmployeeID',
      orderDate: 'OrderDate',
      requiredDate: 'RequiredDate',
      shippedDate: 'ShippedDate',
      shipVia: 'ShipVia',
      freight: 'Freight',
      shipName: 'ShipName',
      shipCity: 'ShipCity',
      shipCountry: 'ShipCountry',
    };
    const setParts: string[] = [];
    const values: unknown[] = [];
    for (const key of allowed) {
      if (key in fields) {
        setParts.push(`${columnMap[key]} = ?`);
        values.push(fields[key] ?? null);
      }
    }
    if (setParts.length === 0) return this.findById(orderId);
    const info = this.db
      .prepare(`UPDATE orders SET ${setParts.join(', ')} WHERE OrderID = ?`)
      .run(...values, orderId);
    if (info.changes === 0) return null;
    return this.findById(orderId);
  }

  delete(orderId: number): boolean {
    // order_details rows cascade on delete (FK ON DELETE CASCADE).
    const info = this.db.prepare('DELETE FROM orders WHERE OrderID = ?').run(orderId);
    return info.changes > 0;
  }
}
