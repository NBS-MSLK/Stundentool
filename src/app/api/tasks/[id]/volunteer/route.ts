import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request, context: unknown) {
  const { id } = await (context as any).params;
  try {
    const body = await request.json();
    const { userId, userName, role } = body;

    if (!userId || !userName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if already volunteered
    const existing = await prisma.taskVolunteer.findFirst({
      where: { taskId: id, userId }
    });

    if (existing) {
      return NextResponse.json({ error: 'User already volunteered' }, { status: 400 });
    }

    const volunteer = await prisma.taskVolunteer.create({
      data: {
        taskId: id,
        userId,
        userName,
        role: role || 'HELPER'
      }
    });

    return NextResponse.json({ volunteer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: unknown) {
  const { id } = await (context as any).params;
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    await prisma.taskVolunteer.deleteMany({
      where: { taskId: id, userId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
