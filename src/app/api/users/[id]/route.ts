import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const bodyText = await req.text();
    console.log('[DEBUG] user update body:', bodyText);
    const body = JSON.parse(bodyText);
    const { password, showInHighscore } = body;

    const data: any = {};
    if (password !== undefined) data.password = password;
    if (showInHighscore !== undefined) data.showInHighscore = showInHighscore;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No data to update' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('[DEBUG] Update user error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
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
