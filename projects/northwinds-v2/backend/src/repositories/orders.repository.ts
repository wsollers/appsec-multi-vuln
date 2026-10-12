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
  /** Optional employee filter. */
  employeeIdScope?: number | null;
  customerId?: string | undefined;
}

/** Orders and line-item persistence. */
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

  listDetails(orderId: number, page: PageRequest): Paginated<OrderDetail> {
    const offset = (page.page - 1) * page.pageSize;
    const total = (
      this.db.prepare('SELECT COUNT(*) AS c FROM order_details WHERE OrderID = ?').get(orderId) as {
        c: number;
      }
    ).c;
    const rows = this.db
      .prepare('SELECT * FROM order_details WHERE OrderID = ? ORDER BY ProductID ASC LIMIT ? OFFSET ?')
      .all(orderId, page.pageSize, offset) as Record<string, unknown>[];
    return { items: rows.map(mapOrderDetail), page: page.page, pageSize: page.pageSize, total };
  }

  findDetail(orderId: number, productId: number): OrderDetail | null {
    const row = this.db
      .prepare('SELECT * FROM order_details WHERE OrderID = ? AND ProductID = ?')
      .get(orderId, productId) as Record<string, unknown> | undefined;
    return row ? mapOrderDetail(row) : null;
  }

  createDetail(orderId: number, fields: OrderDetailWriteFields): OrderDetail {
    this.db
      .prepare(
        'INSERT INTO order_details (OrderID, ProductID, UnitPrice, Quantity, Discount) VALUES (?, ?, ?, ?, ?)',
      )
      .run(orderId, fields.productId, fields.unitPrice, fields.quantity, fields.discount);
    const detail = this.findDetail(orderId, fields.productId);
    if (!detail) throw new Error('Order detail vanished after insert');
    return detail;
  }

  updateDetail(
    orderId: number,
    productId: number,
    fields: Partial<Omit<OrderDetailWriteFields, 'productId'>>,
  ): OrderDetail | null {
    const columns: Record<string, string> = {
      unitPrice: 'UnitPrice',
      quantity: 'Quantity',
      discount: 'Discount',
    };
    const keys = Object.keys(fields).filter((key) => key in columns);
    if (keys.length === 0) return this.findDetail(orderId, productId);
    const setClause = keys.map((key) => `${columns[key]} = ?`).join(', ');
    const values = keys.map((key) => fields[key as keyof typeof fields]);
    const info = this.db
      .prepare(`UPDATE order_details SET ${setClause} WHERE OrderID = ? AND ProductID = ?`)
      .run(...values, orderId, productId);
    return info.changes > 0 ? this.findDetail(orderId, productId) : null;
  }

  deleteDetail(orderId: number, productId: number): boolean {
    const info = this.db
      .prepare('DELETE FROM order_details WHERE OrderID = ? AND ProductID = ?')
      .run(orderId, productId);
    return info.changes > 0;
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
