import { z } from 'zod';
import type { PageRequest } from '../../domain/types.js';

/** Pagination settings. */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(25),
});

export function parsePagination(query: unknown): PageRequest {
  return PaginationSchema.parse(query);
}

export const SortDirectionSchema = z.enum(['ASC', 'DESC']).default('ASC');

/** Numeric id path param. */
export const NumericIdSchema = z.coerce.number().int().positive();

/** Northwind customer identifier. */
export const CustomerIdSchema = z.string().min(1).max(100);
