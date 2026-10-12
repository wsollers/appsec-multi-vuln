import { Router, type Request } from 'express';
import { z, type ZodTypeAny } from 'zod';
import type { EntityService } from '../../services/entity.service.js';
import type { Resource } from '../../auth/rbac.js';
import { parsePagination, SortDirectionSchema } from '../validators/common.js';
import { toColumnRecord } from '../validators/entities.js';
import { BadRequest } from '../errors.js';

export interface CrudRouterConfig<T> {
  resource: Resource;
  service: (req: Request) => EntityService<T>;
  createSchema: ZodTypeAny;
  updateSchema: ZodTypeAny;
  columnMap: Record<string, string>;
  idSchema: ZodTypeAny;
  filterMap?: Record<string, { column: string; schema: ZodTypeAny }>;
  sortMap?: Record<string, string>;
}

export function buildCrudRouter<T>(cfg: CrudRouterConfig<T>): Router {
  const router = Router();

  router.get(`/`, (req, res) => {
    const page = parsePagination(req.query);
    const filters: Record<string, string | number | null> = {};
    if (cfg.filterMap) {
      for (const [param, def] of Object.entries(cfg.filterMap)) {
        const raw = req.query[param];
        if (raw !== undefined) {
          filters[def.column] = def.schema.parse(raw);
        }
      }
    }
    let sort: { column: string; direction: 'ASC' | 'DESC' } | undefined;
    if (typeof req.query.sort === 'string' && cfg.sortMap) {
      const column = cfg.sortMap[req.query.sort];
      if (!column) throw BadRequest('Unsupported sort field');
      sort = { column, direction: SortDirectionSchema.parse(req.query.sortDir ?? 'ASC') };
    }
    const result = cfg.service(req).list({ page, filters, sort });
    res.json(result);
  });

  router.get(`/:id`, (req, res) => {
    const id = cfg.idSchema.parse(req.params.id);
    res.json(cfg.service(req).get(id));
  });

  router.post(`/`, (req, res) => {
    const input = cfg.createSchema.parse(req.body) as Record<string, unknown>;
    const record = toColumnRecord(input, cfg.columnMap);
    res.status(201).json(cfg.service(req).create(record));
  });

  router.put(`/:id`, (req, res) => {
    const id = cfg.idSchema.parse(req.params.id);
    const input = cfg.updateSchema.parse(req.body) as Record<string, unknown>;
    const record = toColumnRecord(input, cfg.columnMap);
    res.json(cfg.service(req).update(id, record));
  });

  router.delete(`/:id`, (req, res) => {
    const id = cfg.idSchema.parse(req.params.id);
    cfg.service(req).remove(id);
    res.status(204).send();
  });

  return router;
}

export const numberFilter = z.coerce.number().int();
export const stringFilter = z.string().trim().max(100);
export const boolFilter = z
  .enum(['true', 'false'])
  .transform((v) => (v === 'true' ? 1 : 0));
