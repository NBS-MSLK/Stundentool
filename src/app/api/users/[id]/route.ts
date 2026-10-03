import { secureRoute } from '@/lib/api-access';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function handleGET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const user = await prisma.user.findUnique({ 
      where: { id },
      include: { subscribedTasks: true }
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
    const { password, showInHighscore, email, emailPref, notifyHeadlines, notifyNews, notifyPolls } = body;

    const data: any = {};
    if (password !== undefined) {
      if (typeof password !== 'string' || !password.trim()) return NextResponse.json({ error: 'Passwort darf nicht leer sein.' }, { status: 400 });
      data.password = password;
    }
    if (showInHighscore !== undefined) data.showInHighscore = showInHighscore;
    if (email !== undefined) data.email = email;
    if (emailPref !== undefined) data.emailPref = emailPref;
    if (notifyHeadlines !== undefined) data.notifyHeadlines = notifyHeadlines;
    if (notifyNews !== undefined) data.notifyNews = notifyNews;
    if (notifyPolls !== undefined) data.notifyPolls = notifyPolls;

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

    // Einträge zuerst löschen um sqlite foreign key constraints zu umgehen, ohne Schema zu ändern
    await prisma.timeEntry.deleteMany({
      where: { userId: id }
    });

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = secureRoute("/api/users/[id]", handleGET);
export const PUT = secureRoute("/api/users/[id]", handlePUT);
export const DELETE = secureRoute("/api/users/[id]", handleDELETE);
