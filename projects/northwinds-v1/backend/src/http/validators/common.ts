import { z } from 'zod';
import type { PageRequest } from '../../domain/types.js';

/** Pagination with capped page size (design §5.1, threat D2). */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
});

export function parsePagination(query: unknown): PageRequest {
  return PaginationSchema.parse(query);
}

export const SortDirectionSchema = z.enum(['ASC', 'DESC']).default('ASC');

/** Numeric id path param. */
export const NumericIdSchema = z.coerce.number().int().positive();

/** Northwind customer ids are 5 uppercase letters. */
export const CustomerIdSchema = z
  .string()
  .regex(/^[A-Z]{5}$/u, 'Customer id must be 5 uppercase letters');
