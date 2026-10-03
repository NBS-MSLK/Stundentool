import { hashPassword } from '@/lib/password.mjs';
import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

async function handleGET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const user = await prisma.user.findUnique({ 
      where: { id }
    });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handlePUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const bodyText = await req.text();

    const body = JSON.parse(bodyText);
    const { password, showInHighscore } = body;

    const data: any = {};
    if (password !== undefined) {
      if (typeof password !== 'string' || !password.trim() || password.length > 4096) return NextResponse.json({ error: 'Passwort darf nicht leer sein.' }, { status: 400 });
      data.password = '';
      data.passwordHash = await hashPassword(password);
    }
    if (showInHighscore !== undefined) data.showInHighscore = showInHighscore;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No data to update' }, { status: 400 });
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({ where: { id }, data });
      if (password !== undefined) await tx.session.deleteMany({ where: { userId: id } });
      return updated;
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('User update failed');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleDELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;

    // Roll back the entries too if another relation prevents deleting the user.
    await prisma.$transaction(async (tx) => {
      await tx.timeEntry.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') return NextResponse.json({ error: 'Benutzer nicht gefunden.' }, { status: 404 });
      if (error.code === 'P2003') return NextResponse.json({ error: 'Der Benutzer ist noch mit Aufgaben, Beiträgen oder Anschaffungsvorschlägen verknüpft und kann deshalb nicht gelöscht werden. Es wurden keine Daten gelöscht.' }, { status: 409 });
    }
    console.error('Delete user failed');
    return NextResponse.json({ error: 'Benutzer konnte nicht gelöscht werden. Es wurden keine Daten gelöscht.' }, { status: 500 });
  }
}

export const GET = secureRoute("/api/users/[id]", handleGET);
export const PUT = secureRoute("/api/users/[id]", handlePUT);
export const DELETE = secureRoute("/api/users/[id]", handleDELETE);
