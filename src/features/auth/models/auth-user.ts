import type { User as AuthUser } from '@auth/core/types';

export interface ExtendedAuthUser extends AuthUser {
  githubId: string;
  role?: string;
  username: string;
  email: string;
  name: string;
  image: string;
}
