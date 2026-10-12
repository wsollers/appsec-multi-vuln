import type { DB } from '../db/connection.js';
import type { AuthenticatedUser, Role } from '../domain/types.js';

const VALID_ROLES: readonly Role[] = ['viewer', 'sales', 'admin'];

function parseRoles(raw: string): Role[] {
  return raw
    .split(',')
    .map((r) => r.trim())
    .filter((r): r is Role => (VALID_ROLES as readonly string[]).includes(r));
}

/** Lookup of application users (the subjects an IdP would assert). */
export class UsersRepository {
  constructor(private readonly db: DB) {}

  findBySub(sub: string): AuthenticatedUser | null {
    const row = this.db.prepare('SELECT * FROM app_users WHERE Sub = ?').get(sub) as
      | Record<string, unknown>
      | undefined;
    return row ? this.map(row) : null;
  }

  findByUsername(username: string): AuthenticatedUser | null {
    const row = this.db.prepare('SELECT * FROM app_users WHERE Username = ?').get(username) as
      | Record<string, unknown>
      | undefined;
    return row ? this.map(row) : null;
  }

  private map(row: Record<string, unknown>): AuthenticatedUser {
    return {
      sub: String(row.Sub),
      username: String(row.Username),
      roles: parseRoles(String(row.Roles)),
      employeeId: row.EmployeeID === null || row.EmployeeID === undefined ? null : Number(row.EmployeeID),
    };
  }
}
