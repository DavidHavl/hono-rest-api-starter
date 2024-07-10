import { emitter } from '@/events';
import type { GitHubUser } from '@/features/auth/models/github-user';
import { useGithubProvider } from '@/features/auth/providers/github.provider';
import { createSession } from '@/features/auth/utils/session';
import { badRequestResponse } from '@/features/shared/responses/bad-request.response';
import { unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import type { User } from '@/features/user/models/user.type';
import { UsersTable } from '@/features/user/models/users.table';
import type { Env } from '@/types';
import { OAuth2RequestError, generateState } from 'arctic';
import { eq } from 'drizzle-orm';
import type { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { sign } from 'hono/jwt';
import { z } from 'zod';

// LOCAL SCHEMAS //
const QuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});
interface RequestValidationTargets {
  out: {
    query: z.infer<typeof QuerySchema>;
  };
}

// HANDLERS //

// https://thecopenhagenbook.com/oauth
export const signinHandler = async (c: Context<Env, 'auth/github'>) => {
  // Get GitHub auth provider
  const github = useGithubProvider(
    c.env.AUTH_GITHUB_CLIENT_ID,
    c.env.AUTH_GITHUB_CLIENT_SECRET,
    c.env.AUTH_REDIRECT_URL,
  );
  // Generate state (ramdom string to prevent CSRF attacks)
  const state = generateState();
  // Create the authorization URL
  const url = await github.createAuthorizationURL(state);
  url.addScopes('read:user', 'user:email');
  // Set the state in a cookie so that we can check/compare it later
  setCookie(c, 'github_oauth_state', state, {
    path: '/',
    secure: c.env.ENVIRONMENT === 'production',
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'Lax',
  });
  // return the authorization URL
  return c.json({
    url: url,
  });
};

export const callbackHandler = async (c: Context<Env, 'auth/github/callback', RequestValidationTargets>) => {
  const db = c.get('db');
  const code = c.req.query('code')?.toString() ?? null;
  const state = c.req.query('state')?.toString() ?? null;
  // Get stored state from cookie (to prevent CSRF attacks)
  const storedState = getCookie(c).github_oauth_state ?? null;
  // Check state and code are present and valid
  if (!code || !state || !storedState || state !== storedState) {
    return badRequestResponse(c, 'Invalid state or code', 'Invalid state or code');
  }

  // Get GitHub auth provider
  const github = useGithubProvider(
    c.env.AUTH_GITHUB_CLIENT_ID,
    c.env.AUTH_GITHUB_CLIENT_SECRET,
    c.env.AUTH_REDIRECT_URL,
  );

  try {
    const tokens = await github.validateAuthorizationCode(code);
    // Get user info from GitHub
    const githubUserResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
        'User-Agent': `${c.env.PROJECT_NAME} client`,
      },
    });
    const githubUser = (await githubUserResponse.json()) as GitHubUser;

    if (!githubUser?.id) {
      return unauthorizedResponse(c);
    }

    // Get user email from GitHub if public one in user info is not present
    if (!githubUser.email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
          'User-Agent': `${c.env.PROJECT_NAME} client`,
        },
      });
      const emails = (await emailResponse.json()) as { email: string; primary: boolean; verified: boolean }[];
      const email = emails.find((e) => e.primary && e.verified)?.email;
      if (email) {
        githubUser.email = email;
      }
    }

    // Get user from DB
    const found = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.githubId, String(githubUser.id)))
      .limit(1);
    let user: User = found.length ? found[0] : null;

    // Check if user exists and update user details
    if (user) {
      // Check if exists but is blocked
      if (user?.isBlocked) {
        return unauthorizedResponse(c, 'User is blocked');
      }
      // Update user details
      await db
        .update(UsersTable)
        .set({
          username: githubUser.login,
          email: githubUser.email,
          fullName: githubUser.name,
          avatarUrl: githubUser.avatar_url,
        })
        .where(eq(UsersTable.githubId, githubUser.id));
    }
    // If email is not set in GitHub account or is not verified or public, return error
    else if (!githubUser.email) {
      return unauthorizedResponse(
        c,
        'A github account with public and verified email is required to create an account!',
      );
    } else {
      // Create new user
      const result: User[] = await db
        .insert(UsersTable)
        .values({
          githubId: String(githubUser.id),
          username: githubUser.login,
          email: githubUser.email,
          fullName: githubUser.name,
          avatarUrl: githubUser.avatar_url,
        })
        .returning();
      user = result[0];
      // Emit event
      await emitter.emit('user.created', c, { user });
    }

    // Session //
    const expiresAt = new Date(Date.now() + c.env.AUTH_SESSION_EXPIRATION_MS);
    const session = await createSession(c, user, expiresAt);
    // Create JWT token containing sesssion ID
    const jwt = await sign({ sessionId: session.id }, c.env.AUTH_SECRET);
    // Store JWT token in cookie
    const cookieName = c.env.ENVIRONMENT === 'production' ? '__Secure-session' : 'session';
    setCookie(c, cookieName, jwt, {
      path: '/',
      secure: c.env.ENVIRONMENT === 'production',
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: 'Lax',
    });
  } catch (e) {
    if (e instanceof OAuth2RequestError && e.code === 'bad_verification_code') {
      // invalid code
      return badRequestResponse(c, 'Invalid verification code', 'Invalid verification code');
    }
    // Rethrow so default error handler and logger can deal with it
    throw e;
  }
};
