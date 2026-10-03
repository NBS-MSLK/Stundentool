import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import prisma from './prisma';

const COOKIE = 'stundentool_session';
const LIFETIME_SECONDS = 7 * 24 * 60 * 60;
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export async function getSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt <= new Date()) return null;
  return session;
}

export async function createSession(userId: string, verifiedPassword: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + LIFETIME_SECONDS * 1000);
  await prisma.$transaction(async tx => {
    // Recheck inside the same transaction as session creation, in case an admin reset the password during login.
    const user = await tx.user.findFirst({ where: { id: userId, password: verifiedPassword }, select: { id: true } });
    if (!user) throw new Error('Credentials changed during login');
    await tx.session.deleteMany({ where: { expiresAt: { lte: new Date() } } });
    await tx.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', path: '/', expires: expiresAt,
  });
}

export async function deleteSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  (await cookies()).delete(COOKIE);
}
