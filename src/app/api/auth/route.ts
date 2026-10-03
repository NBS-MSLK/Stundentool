import { allowLoginAttempt, clearLoginAttempts } from '@/lib/login-throttle';
import { verifyPassword } from '@/lib/password.mjs';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { AccessError, checkOrigin } from '@/lib/api-access';
import { createSession, deleteSession, getSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const { name, password } = await req.json();
    if (typeof name !== 'string' || typeof password !== 'string' || !name.trim() || !password.trim() || password.length > 4096 || name.length > 200) {
      return NextResponse.json({ error: 'Name und Passwort erforderlich.' }, { status: 400 });
    }
    if (!allowLoginAttempt(name)) return NextResponse.json({ error: 'Zu viele Anmeldeversuche. Bitte in 15 Minuten erneut versuchen.' }, { status: 429, headers: { 'Retry-After': '900' } });
    // Explicit opt-in: credentials are otherwise omitted by the shared Prisma client.
    const user = await prisma.user.findUnique({ where: { name: name.trim() }, omit: { passwordHash: false } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Name oder Passwort falsch. Zugänge ohne Passwort müssen vom Vorstand freigeschaltet werden.' }, { status: 401 });
    }
    clearLoginAttempts(name);
    // Preserve the stored role. A name must never confer administrator privileges.
    await deleteSession();
    await createSession(user.id, user.passwordHash!);
    const { passwordHash: credential, ...safeUser } = user;
    void credential;
    return NextResponse.json({ user: safeUser }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof AccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Anmeldung fehlgeschlagen.' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Bitte anmelden.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json({ user: session.user }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function DELETE(req: Request) {
  try {
    checkOrigin(req);
    await deleteSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Abmeldung fehlgeschlagen.' }, { status: 500 });
  }
}
