import type { AUTH_ROLES } from '@/features/auth/constants';

export type AuthRole = (typeof AUTH_ROLES)[number];
