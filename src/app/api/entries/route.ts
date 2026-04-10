import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const all = searchParams.get('all');
  const showArchived = searchParams.get('archived') === 'true';

  try {
    if (all === 'true') {
      const entries = await prisma.timeEntry.findMany({
        where: showArchived ? undefined : { isArchived: false },
        include: { user: true },
        orderBy: { startTime: 'asc' },
      });
      return NextResponse.json({ entries });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const entries = await prisma.timeEntry.findMany({
      where: showArchived ? { userId } : { userId, isArchived: false },
      orderBy: { startTime: 'desc' },
    });
    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, startTime, endTime, activity, note } = await req.json();

    if (!userId || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs > 10 * 60 * 60 * 1000) {
      return NextResponse.json({ error: 'Maximal 10 Stunden pro Eintrag erlaubt.' }, { status: 400 });
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId,
        startTime: start,
        endTime: end,
        activity,
        isConfirmed: true, // Manual entries are confirmed by default or by admin
        isManualEntry: true,
        note
      },
    });
    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
