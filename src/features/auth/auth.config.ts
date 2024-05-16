import { emitter } from '@/events';
import type { ExtendedAuthUser } from '@/features/auth/models/auth-user';
import type { User } from '@/features/user/models/user.type';
import { UsersTable } from '@/features/user/models/users.table';
import type { Env, Vars } from '@/types';
import GitHub from '@auth/core/providers/github';
import type { JWT } from '@auth/core/src/jwt';
import type { Session } from '@auth/core/types';
import type { AuthConfig } from '@hono/auth-js';
import { eq } from 'drizzle-orm';
import type { Context } from 'hono';

function getAuthConfig(c: Context<{ Bindings: Env; Variables: Vars }>): AuthConfig {
  return {
    debug: true,
    basePath: '/auth',
    secret: c.env.AUTH_SECRET,
    cookies: {
      pkceCodeVerifier: {
        name: 'authjs.pkce.code_verifier',
        options: {
          // domain: c.env.COOKIE_DOMAIN,
          httpOnly: true,
          sameSite: 'none',
          path: '/',
          secure: false,
        },
      },
    },
    providers: [
      GitHub({
        clientId: c.env.AUTH_GITHUB_CLIENT_ID,
        clientSecret: c.env.AUTH_GITHUB_CLIENT_SECRET,
        checks: ['none'], // TODO: this is very unsecure!
        profile: (profile) => {
          // Build simple object from GitHub profile
          return {
            githubId: String(profile.id),
            username: profile.login,
            email: profile.email,
            name: profile.name,
            image: profile.avatar_url,
          };
        },
      }),
    ],
    callbacks: {
      async signIn({ user, email }) {
        // Controls whether a user is allowed to sign in or not.

        // If we don't have a githubId, we can't do anything
        if ((user as ExtendedAuthUser).githubId === undefined) {
          return false;
        }

        console.log('in signIn callback', user, email);

        const db = c.get('db');
        // Get user from DB
        const result = await db
          .select()
          .from(UsersTable)
          .where(eq(UsersTable.githubId, String((user as ExtendedAuthUser).githubId)))
          .limit(1);
        const existingUser: User = result.length ? result[0] : null;

        // Check if user exists and update user details
        if (existingUser) {
          // Check if exists but is blocked
          if (existingUser?.isBlocked) {
            return false;
          }
          // Update user details
          await db
            .update(UsersTable)
            .set({
              username: (user as ExtendedAuthUser).username,
              email: user.email,
              fullName: user.name,
              avatarUrl: user.image,
            })
            .where(eq(UsersTable.githubId, (user as ExtendedAuthUser).githubId));
        }
        // If user does not exist and email.verificationRequest is undefined, create user
        else if (!email?.verificationRequest) {
          const result: User[] = await db
            .insert(UsersTable)
            .values({
              githubId: (user as ExtendedAuthUser).githubId,
              username: (user as ExtendedAuthUser).username,
              email: user.email,
              fullName: user.name,
              avatarUrl: user.image,
            })
            .returning();
          emitter.emit('user.created', { c, user: result[0] });
        }
        return true;
      },
      async jwt({ token, user }) {
        // The arguments user, account, profile and trigger are only passed the first time this callback is called on a new session,
        // after the user signs in. In subsequent calls, only token will be available.
        // Enhance token with user role (for client-side authorization checks)
        if ((user as ExtendedAuthUser)?.githubId) {
          // Get user from DB
          const db = c.get('db');
          const result = await db
            .select()
            .from(UsersTable)
            .where(eq(UsersTable.githubId, String((user as ExtendedAuthUser).githubId)))
            .limit(1);
          const existingUser: User = result.length ? result[0] : null;
          // Add user role to token
          if (existingUser?.role) {
            token.sub = existingUser.id;
            token.role = existingUser.role;
            token.name = existingUser.fullName ?? existingUser.username;
            token.picture = existingUser.avatarUrl;
          }
        }
        console.log('in jwt callback - returning token', token);
        return token;
      },
      async session({ session, token }: { session: Session; token: JWT }) {
        // Add user role to session (for clientside or server-side authorization checks)
        if (session?.user) {
          session.user.id = token.sub;
          (session.user as ExtendedAuthUser).role = token.role ? String(token.role) : 'user';
          session.user.name = token.name;
          session.user.image = token.picture;
        }
        return session;
      },
      async redirect() {
        // https://authjs.dev/guides/basics/callbacks#redirect-callback
        return c.env.AUTH_REDIRECT_URL;
      },
    },
  };
}
export { getAuthConfig };
