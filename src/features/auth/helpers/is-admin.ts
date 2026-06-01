import { AUTH_ROLE_ADMIN } from '@/features/constants';

export function isAdmin(user: User): boolean {
  return user.role === AUTH_ROLE_ADMIN;
}
