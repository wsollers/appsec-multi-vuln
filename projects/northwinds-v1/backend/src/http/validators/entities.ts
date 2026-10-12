import { z } from 'zod';
import { CustomerIdSchema } from './common.js';

/**
 * Edge validation schemas. These double as the field allow-list for mutations:
 * `.strict()` rejects unknown keys so clients cannot attempt mass assignment
 * (design §6, threat T2). Server-owned identifiers are never accepted here.
 */

const nullableStr = (max: number) => z.string().trim().max(max).nullable().optional();

export const CategoryCreateSchema = z
  .object({
    categoryName: z.string().trim().min(1).max(100),
    description: nullableStr(2000),
  })
  .strict();
export const CategoryUpdateSchema = CategoryCreateSchema.partial().strict();

export const SupplierCreateSchema = z
  .object({
    companyName: z.string().trim().min(1).max(100),
    contactName: nullableStr(100),
    contactTitle: nullableStr(100),
    city: nullableStr(100),
    country: nullableStr(100),
    phone: nullableStr(40),
  })
  .strict();
export const SupplierUpdateSchema = SupplierCreateSchema.partial().strict();

export const ProductCreateSchema = z
  .object({
    productName: z.string().trim().min(1).max(100),
    supplierId: z.number().int().positive().nullable().optional(),
    categoryId: z.number().int().positive().nullable().optional(),
    unitPrice: z.number().nonnegative().default(0),
    unitsInStock: z.number().int().nonnegative().default(0),
    discontinued: z.boolean().default(false),
  })
  .strict();
export const ProductUpdateSchema = ProductCreateSchema.partial().strict();

export const CustomerCreateSchema = z
  .object({
    customerId: CustomerIdSchema,
    companyName: z.string().trim().min(1).max(100),
    contactName: nullableStr(100),
    contactTitle: nullableStr(100),
    city: nullableStr(100),
    country: nullableStr(100),
    phone: nullableStr(40),
  })
  .strict();
export const CustomerUpdateSchema = CustomerCreateSchema.omit({ customerId: true })
  .partial()
  .strict();

export const EmployeeCreateSchema = z
  .object({
    lastName: z.string().trim().min(1).max(100),
    firstName: z.string().trim().min(1).max(100),
    title: nullableStr(100),
    reportsTo: z.number().int().positive().nullable().optional(),
    city: nullableStr(100),
    country: nullableStr(100),
  })
  .strict();
export const EmployeeUpdateSchema = EmployeeCreateSchema.partial().strict();

export const ShipperCreateSchema = z
  .object({
    companyName: z.string().trim().min(1).max(100),
    phone: nullableStr(40),
  })
  .strict();
export const ShipperUpdateSchema = ShipperCreateSchema.partial().strict();

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, 'Date must be YYYY-MM-DD')
  .nullable()
  .optional();

export const OrderDetailSchema = z
  .object({
    productId: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
    quantity: z.number().int().positive(),
    discount: z.number().min(0).max(1).default(0),
  })
  .strict();

export const OrderCreateSchema = z
  .object({
    customerId: CustomerIdSchema.nullable().optional(),
    employeeId: z.number().int().positive().nullable().optional(),
    orderDate: isoDate,
    requiredDate: isoDate,
    shippedDate: isoDate,
    shipVia: z.number().int().positive().nullable().optional(),
    freight: z.number().nonnegative().default(0),
    shipName: nullableStr(100),
    shipCity: nullableStr(100),
    shipCountry: nullableStr(100),
    details: z.array(OrderDetailSchema).min(1).max(100),
  })
  .strict();

export const OrderUpdateSchema = z
  .object({
    customerId: CustomerIdSchema.nullable().optional(),
    employeeId: z.number().int().positive().nullable().optional(),
    orderDate: isoDate,
    requiredDate: isoDate,
    shippedDate: isoDate,
    shipVia: z.number().int().positive().nullable().optional(),
    freight: z.number().nonnegative().optional(),
    shipName: nullableStr(100),
    shipCity: nullableStr(100),
    shipCountry: nullableStr(100),
  })
  .strict();

/** Normalizes validated entity input into the DB column shape (allow-listed). */
export function toColumnRecord(
  input: Record<string, unknown>,
  map: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [field, column] of Object.entries(map)) {
    if (field in input) {
      const value = input[field];
      out[column] = typeof value === 'boolean' ? (value ? 1 : 0) : value;
    }
  }
  return out;
}
