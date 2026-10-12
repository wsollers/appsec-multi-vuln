import { Router } from 'express';
import { requirePermission, requireUser } from '../middleware/auth.js';
import { parsePagination, NumericIdSchema, CustomerIdSchema } from '../validators/common.js';
import { OrderCreateSchema, OrderUpdateSchema } from '../validators/entities.js';
import type {
  OrderDetailWriteFields,
  OrderWriteFields,
} from '../../repositories/orders.repository.js';

/**
 * Orders REST router. RBAC is enforced here; OBJECT-LEVEL authorization is
 * enforced in the service (threat I1/IDOR) so a valid role is never enough to
 * reach another employee's order.
 */
export function buildOrdersRouter(): Router {
  const router = Router();

  router.get('/', requirePermission('orders:read'), (req, res) => {
    const page = parsePagination(req.query);
    const user = requireUser(req);
    const customerId =
      typeof req.query.customerId === 'string'
        ? CustomerIdSchema.parse(req.query.customerId)
        : undefined;
    res.json(req.ctx.services.orders.list(user, page, customerId));
  });

  router.get('/:id', requirePermission('orders:read'), (req, res) => {
    const id = NumericIdSchema.parse(req.params.id);
    const user = requireUser(req);
    res.json(req.ctx.services.orders.get(user, id));
  });

  router.post('/', requirePermission('orders:write'), (req, res) => {
    const input = OrderCreateSchema.parse(req.body);
    const user = requireUser(req);
    const { details, ...orderFields } = input;
    const order: OrderWriteFields = {
      customerId: orderFields.customerId ?? null,
      employeeId: orderFields.employeeId ?? null,
      orderDate: orderFields.orderDate ?? null,
      requiredDate: orderFields.requiredDate ?? null,
      shippedDate: orderFields.shippedDate ?? null,
      shipVia: orderFields.shipVia ?? null,
      freight: orderFields.freight,
      shipName: orderFields.shipName ?? null,
      shipCity: orderFields.shipCity ?? null,
      shipCountry: orderFields.shipCountry ?? null,
    };
    const detailRows: OrderDetailWriteFields[] = details.map((d) => ({
      productId: d.productId,
      unitPrice: d.unitPrice,
      quantity: d.quantity,
      discount: d.discount,
    }));
    const created = req.ctx.services.orders.create(user, { order, details: detailRows });
    res.status(201).json(created);
  });

  router.put('/:id', requirePermission('orders:write'), (req, res) => {
    const id = NumericIdSchema.parse(req.params.id);
    const input = OrderUpdateSchema.parse(req.body);
    const user = requireUser(req);
    const fields: Partial<OrderWriteFields> = {};
    if ('customerId' in input) fields.customerId = input.customerId ?? null;
    if ('employeeId' in input) fields.employeeId = input.employeeId ?? null;
    if ('orderDate' in input) fields.orderDate = input.orderDate ?? null;
    if ('requiredDate' in input) fields.requiredDate = input.requiredDate ?? null;
    if ('shippedDate' in input) fields.shippedDate = input.shippedDate ?? null;
    if ('shipVia' in input) fields.shipVia = input.shipVia ?? null;
    if ('freight' in input && input.freight !== undefined) fields.freight = input.freight;
    if ('shipName' in input) fields.shipName = input.shipName ?? null;
    if ('shipCity' in input) fields.shipCity = input.shipCity ?? null;
    if ('shipCountry' in input) fields.shipCountry = input.shipCountry ?? null;
    res.json(req.ctx.services.orders.update(user, id, fields));
  });

  router.delete('/:id', requirePermission('orders:write'), (req, res) => {
    const id = NumericIdSchema.parse(req.params.id);
    const user = requireUser(req);
    req.ctx.services.orders.remove(user, id);
    res.status(204).send();
  });

  return router;
}
