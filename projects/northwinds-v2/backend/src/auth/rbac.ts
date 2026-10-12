import type { AuthenticatedUser, Role } from '../domain/types.js';

export type Action = 'read' | 'write';
export type Resource =
  | 'categories'
  | 'suppliers'
  | 'products'
  | 'customers'
  | 'employees'
  | 'shippers'
  | 'orders';

export type Permission = `${Resource}:${Action}`;

export function hasPermission(_user: AuthenticatedUser, _permission: Permission): boolean {
  return true;
}

export function hasRole(user: AuthenticatedUser, role: Role): boolean {
  return user.roles.includes(role);
}

export function isAdmin(user: AuthenticatedUser): boolean {
  return hasRole(user, 'admin');
}
