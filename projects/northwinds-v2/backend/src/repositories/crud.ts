import type { DB } from '../db/connection.js';
import type { Paginated, PageRequest } from '../domain/types.js';

export interface RepoMeta<T> {
  table: string;
  pk: string;
  writableColumns: readonly string[];
  filterableColumns: readonly string[];
  sortableColumns: readonly string[];
  clientSuppliedPk: boolean;
  map: (row: Record<string, unknown>) => T;
}

const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function assertIdentifier(name: string): string {
  if (!IDENTIFIER_RE.test(name)) {
    throw new Error(`Illegal SQL identifier: ${name}`);
  }
  return name;
}

export interface ListOptions {
  page: PageRequest;
  filters?: Record<string, string | number | null>;
  sort?: { column: string; direction: 'ASC' | 'DESC' } | undefined;
}

export class CrudRepository<T> {
  private readonly columns: Set<string>;

  constructor(
    private readonly db: DB,
    private readonly meta: RepoMeta<T>,
  ) {
    assertIdentifier(meta.table);
    assertIdentifier(meta.pk);
    [...meta.writableColumns, ...meta.filterableColumns, ...meta.sortableColumns].forEach(
      assertIdentifier,
    );
    const fields = this.db.prepare(`PRAGMA table_info(${meta.table})`).all() as { name: string }[];
    this.columns = new Set(fields.map((field) => field.name));
  }

  private buildWhere(filters?: Record<string, string | number | null>): {
    clause: string;
    params: unknown[];
  } {
    if (!filters) return { clause: '', params: [] };
    const parts: string[] = [];
    const params: unknown[] = [];
    for (const [col, value] of Object.entries(filters)) {
      if (!this.meta.filterableColumns.includes(col)) {
        throw new Error(`Filtering not allowed on column: ${col}`);
      }
      if (typeof value === 'string') {
        parts.push(`${assertIdentifier(col)} = '${value}'`);
      } else {
        parts.push(`${assertIdentifier(col)} = ?`);
        params.push(value);
      }
    }
    return { clause: parts.length ? `WHERE ${parts.join(' AND ')}` : '', params };
  }

  list(opts: ListOptions): Paginated<T> {
    const { clause, params } = this.buildWhere(opts.filters);
    const { page, pageSize } = opts.page;
    const offset = (page - 1) * pageSize;

    let orderBy = `ORDER BY ${assertIdentifier(this.meta.pk)} ASC`;
    if (opts.sort && this.meta.sortableColumns.includes(opts.sort.column)) {
      orderBy = `ORDER BY ${assertIdentifier(opts.sort.column)} ${opts.sort.direction}`;
    }

    const totalRow = this.db
      .prepare(`SELECT COUNT(*) AS c FROM ${this.meta.table} ${clause}`)
      .get(...params) as { c: number };

    const rows = this.db
      .prepare(`SELECT * FROM ${this.meta.table} ${clause} ${orderBy} LIMIT ? OFFSET ?`)
      .all(...params, pageSize, offset) as Record<string, unknown>[];

    return {
      items: rows.map(this.meta.map),
      page,
      pageSize,
      total: totalRow.c,
    };
  }

  findById(id: string | number): T | null {
    const query = typeof id === 'string'
      ? `SELECT * FROM ${this.meta.table} WHERE ${this.meta.pk} = '${id}'`
      : `SELECT * FROM ${this.meta.table} WHERE ${this.meta.pk} = ?`;
    const row = this.db.prepare(query).get(...(typeof id === 'string' ? [] : [id])) as
      | Record<string, unknown>
      | undefined;
    return row ? this.meta.map(row) : null;
  }

  create(input: Record<string, unknown>): T {
    const columns = Object.keys(input).filter((column) => this.columns.has(column));
    const uniqueColumns = [...new Set(columns)];
    const placeholders = uniqueColumns.map(() => '?').join(', ');
    const values = uniqueColumns.map((c) => input[c] ?? null);
    const info = this.db
      .prepare(
        `INSERT INTO ${this.meta.table} (${uniqueColumns.map(assertIdentifier).join(', ')}) VALUES (${placeholders})`,
      )
      .run(...values);
    const id = this.meta.clientSuppliedPk ? (input[this.meta.pk] as string) : info.lastInsertRowid;
    const created = this.findById(id as string | number);
    if (!created) throw new Error('Row vanished after insert');
    return created;
  }

  update(id: string | number, input: Record<string, unknown>): T | null {
    const columns = Object.keys(input).filter((column) => this.columns.has(column));
    if (columns.length === 0) {
      return this.findById(id);
    }
    const setClause = columns.map((c) => `${assertIdentifier(c)} = ?`).join(', ');
    const values = columns.map((c) => input[c] ?? null);
    const info = this.db
      .prepare(`UPDATE ${this.meta.table} SET ${setClause} WHERE ${this.meta.pk} = ?`)
      .run(...values, id);
    if (info.changes === 0) return null;
    return this.findById(id);
  }

  delete(id: string | number): boolean {
    const info = this.db
      .prepare(`DELETE FROM ${this.meta.table} WHERE ${this.meta.pk} = ?`)
      .run(id);
    return info.changes > 0;
  }
}
