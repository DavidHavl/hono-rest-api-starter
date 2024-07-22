import type { Session } from '@/features/auth/models/session.type';
import type { User } from '@/features/user/models/user.type';
import type { Env } from '@/types';
import { getRandomBytes } from '@/utils/crypto';
import type { Context } from 'hono';

export const createSession = async (c: Context<Env>, user: User, expiresAt: Date): Promise<Session> => {
  const id = getRandomBytes(32);
  const data = {
    id,
    userId: user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: expiresAt,
  };
  await c.get('kv').put(`session_${id}`, JSON.stringify(data), {
    expiration: expiresAt.getTime() / 1000,
  });
  return data;
};

export const updateSessionExpiration = async (
  c: Context<Env>,
  sessionId: string,
  expiresAt: Date,
): Promise<Session> => {
  const session = await getSessionById(c, sessionId);
  if (session) {
    session.expiresAt = expiresAt;
    await c.get('kv').put(`session_${sessionId}`, JSON.stringify(session), {
      expiration: expiresAt.getTime() / 1000,
    });
  }
  return session;
};

export const getSessionById = async (c: Context<Env>, id: string) => {
  const data = await c.get('kv').get(`session_${id}`);
  return data ? JSON.parse(data) : null;
};

export const deleteSession = async (c: Context<Env>, sessionId: string) => {
  return c.get('kv').delete(`session_${sessionId}`);
};
