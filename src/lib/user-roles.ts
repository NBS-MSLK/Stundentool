export const USER_ROLES = [
  { value: 'USER', label: 'Benutzer' },
  { value: 'ADMIN', label: 'Admin' },
] as const;

export type UserRole = typeof USER_ROLES[number]['value'];

export function isUserRole(value: unknown): value is UserRole {
  return USER_ROLES.some(role => role.value === value);
}
