import type { AuthenticatedUser, Role } from '../domain/types.js';

/**
 * Role-based access control. Permissions are evaluated on the SERVER for every
 * request (design §6, threat E1). The UI never decides access.
 *
 * Permission naming: `<resource>:<action>` where action is read|write.
 */
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

const RESOURCES: Resource[] = [
  'categories',
  'suppliers',
  'products',
  'customers',
  'employees',
  'shippers',
  'orders',
];

// Deny-by-default: a role has exactly the permissions listed here (threat E3).
const ROLE_PERMISSIONS: Record<Role, Set<Permission>> = {
  viewer: new Set<Permission>(RESOURCES.map((r) => `${r}:read` as Permission)),
  sales: new Set<Permission>([
    ...RESOURCES.map((r) => `${r}:read` as Permission),
    'orders:write',
    'customers:write',
  ]),
  admin: new Set<Permission>(
    RESOURCES.flatMap((r) => [`${r}:read` as Permission, `${r}:write` as Permission]),
  ),
};

export function hasPermission(user: AuthenticatedUser, permission: Permission): boolean {
  return user.roles.some((role) => ROLE_PERMISSIONS[role]?.has(permission));
}

export function hasRole(user: AuthenticatedUser, role: Role): boolean {
  return user.roles.includes(role);
}

export function isAdmin(user: AuthenticatedUser): boolean {
  return hasRole(user, 'admin');
}
