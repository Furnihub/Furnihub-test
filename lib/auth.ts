// Simple session-cookie based auth (V1.0)
// Token stored in httpOnly cookie, maps to Session row.

import { cookies } from 'next/headers';
import { prisma } from './db';
import { randomBytes } from 'crypto';

const COOKIE = 'furnihub_session';
const SESSION_DAYS = 30;

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { userId, token, expiresAt } });
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
  return token;
}

export async function getCurrentUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

export async function destroySession() {
  const token = cookies().get(COOKIE)?.value;
  if (token) await prisma.session.delete({ where: { token } }).catch(() => {});
  cookies().delete(COOKIE);
}

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) throw new Error('UNAUTHORIZED');
  return u;
}
