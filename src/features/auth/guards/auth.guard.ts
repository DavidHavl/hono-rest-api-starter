import { deleteSession, getSessionById } from '@/features/auth/utils/session';
import { unauthorizedResponse } from '@/features/shared/responses/unauthorized.response';
import { isPathMatch } from '@/utils/path';
import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';

type AuthGuardConfig = {
  excludePaths?: string[];
};

/**
 * Middleware (route guard) to check if the user is authenticated
 */
export const authGuard = (config?: AuthGuardConfig) => {
  const excludePaths: string[] = config?.excludePaths || [];
  return async (c: Context, next) => {
    // Skip auth check for excluded paths
    if (isPathMatch(c.req.path, excludePaths)) {
      return next();
    }
    // Get cookie containing the JWT token
    const cookieName = c.env.ENVIRONMENT === 'production' ? '__Secure-session' : 'session';
    const cookieData = getCookie(c, cookieName);
    if (!cookieData) {
      return unauthorizedResponse(c, 'Unauthorized');
    }
    try {
      // Verify the JWT token
      const decodedPayload = await verify(cookieData, c.env.AUTH_SECRET);
      if (!decodedPayload || !decodedPayload.sessionId) {
        return unauthorizedResponse(c, 'Unauthorized');
      }
      const sessionID = String(decodedPayload.sessionId);
      const session = await getSessionById(c, sessionID);
      if (!session || !session.userId) {
        return unauthorizedResponse(c, 'Unauthorized');
      }
      // Check not expired
      if (session.expiresAt < new Date()) {
        // Delete session if expired and it was not deleted automatically for some reason
        await deleteSession(c, sessionID);
        return unauthorizedResponse(c, 'Session expired');
      }

      // Extend session expiration for another 1 day (AUTH_SESSION_EXPIRATION_MS)
      // const expiresAt = new Date(Date.now() + c.env.AUTH_SESSION_EXPIRATION_MS);
      // await updateSessionExpiration(c, sessionID, expiresAt);

      // Set session in context
      c.set('session', session);
    } catch (error) {
      return unauthorizedResponse(c, 'Unauthorized');
    }

    return next();
  };
};
