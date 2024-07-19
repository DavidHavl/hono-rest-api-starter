import { sign } from 'hono/jwt';
import { getRandomBytes } from '../../src/utils/crypto';

export const createAuthCookieContent = async (kv, userId) => {
  const expiresAt = new Date(Date.now() + 10000);
  const id = getRandomBytes(32);
  const session = {
    id,
    userId: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: expiresAt,
  };
  kv.put(`session_${session.id}`, JSON.stringify(session));
  // Create JWT token containing sesssion ID
  const jwt = await sign({ sessionId: session.id }, process.env.AUTH_SECRET);
  // Store JWT token in cookie
  return `session=${jwt}`;
};
