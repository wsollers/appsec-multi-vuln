import type { CrudRepository, ListOptions } from '../repositories/crud.js';
import type { Paginated } from '../domain/types.js';
import { NotFound } from '../http/errors.js';

/** Generic service over a single-table entity. */
export class EntityService<T> {
  constructor(
    private readonly repo: CrudRepository<T>,
    private readonly label: string,
  ) {}

  list(opts: ListOptions): Paginated<T> {
    return this.repo.list(opts);
  }

  get(id: string | number): T {
    const found = this.repo.findById(id);
    if (!found) throw NotFound(`${this.label} not found`);
    return found;
  }

  create(input: Record<string, unknown>): T {
    return this.repo.create(input);
  }

  update(id: string | number, input: Record<string, unknown>): T {
    const updated = this.repo.update(id, input);
    if (!updated) throw NotFound(`${this.label} not found`);
    return updated;
  }

  remove(id: string | number): void {
    const ok = this.repo.delete(id);
    if (!ok) throw NotFound(`${this.label} not found`);
  }
}
