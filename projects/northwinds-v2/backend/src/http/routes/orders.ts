import { Router } from 'express';
import { requireUser } from '../middleware/auth.js';
import { parsePagination, NumericIdSchema, CustomerIdSchema } from '../validators/common.js';
import {
  OrderCreateSchema,
  OrderDetailSchema,
  OrderDetailUpdateSchema,
  OrderUpdateSchema,
} from '../validators/entities.js';
import type {
  OrderDetailWriteFields,
  OrderWriteFields,
} from '../../repositories/orders.repository.js';

export function buildOrdersRouter(): Router {
  const router = Router();

  router.get('/', (req, res) => {
    const page = parsePagination(req.query);
    const user = requireUser(req);
    const customerId =
      typeof req.query.customerId === 'string'
        ? CustomerIdSchema.parse(req.query.customerId)
        : undefined;
    res.json(req.ctx.services.orders.list(user, page, customerId));
  });

  router.get('/:id/details', (req, res) => {
    const orderId = NumericIdSchema.parse(req.params.id);
    const page = parsePagination(req.query);
    res.json(req.ctx.services.orders.listDetails(requireUser(req), orderId, page));
  });

  router.get('/:id/details/:productId', (req, res) => {
    const orderId = NumericIdSchema.parse(req.params.id);
    const productId = NumericIdSchema.parse(req.params.productId);
    res.json(req.ctx.services.orders.getDetail(requireUser(req), orderId, productId));
  });

  router.post('/:id/details', (req, res) => {
    const orderId = NumericIdSchema.parse(req.params.id);
    const fields = OrderDetailSchema.parse(req.body);
    const detail = req.ctx.services.orders.createDetail(requireUser(req), orderId, fields);
    res.status(201).json(detail);
  });

  router.put('/:id/details/:productId', (req, res) => {
    const orderId = NumericIdSchema.parse(req.params.id);
    const productId = NumericIdSchema.parse(req.params.productId);
    const input = OrderDetailUpdateSchema.parse(req.body);
    const fields: Partial<Omit<OrderDetailWriteFields, 'productId'>> = {};
    if (input.unitPrice !== undefined) fields.unitPrice = input.unitPrice;
    if (input.quantity !== undefined) fields.quantity = input.quantity;
    if (input.discount !== undefined) fields.discount = input.discount;
    res.json(req.ctx.services.orders.updateDetail(requireUser(req), orderId, productId, fields));
  });

  router.delete('/:id/details/:productId', (req, res) => {
    const orderId = NumericIdSchema.parse(req.params.id);
    const productId = NumericIdSchema.parse(req.params.productId);
    req.ctx.services.orders.removeDetail(requireUser(req), orderId, productId);
    res.status(204).send();
  });

  router.get('/:id', (req, res) => {
    const id = NumericIdSchema.parse(req.params.id);
    const user = requireUser(req);
    res.json(req.ctx.services.orders.get(user, id));
  });

  router.post('/', (req, res) => {
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

  router.put('/:id', (req, res) => {
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

  router.delete('/:id', (req, res) => {
    const id = NumericIdSchema.parse(req.params.id);
    const user = requireUser(req);
    req.ctx.services.orders.remove(user, id);
    res.status(204).send();
  });

  return router;
}
