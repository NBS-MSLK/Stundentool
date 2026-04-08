import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const all = searchParams.get('all');

  try {
    if (all === 'true') {
      const entries = await prisma.timeEntry.findMany({
        include: { user: true },
        orderBy: { startTime: 'asc' },
      });
      return NextResponse.json({ entries });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const entries = await prisma.timeEntry.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
    });
    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, startTime, endTime, activity } = await req.json();

    if (!userId || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        activity: activity || null,
        isConfirmed: true,
        isManualEntry: true,
      },
    });
    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
