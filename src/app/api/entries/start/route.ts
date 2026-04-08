import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId, activity } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const active = await prisma.timeEntry.findFirst({
      where: { userId, endTime: null },
    });

    if (active) {
      return NextResponse.json({ error: 'Timer already running', entry: active }, { status: 400 });
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId,
        startTime: new Date(),
        activity: activity || null,
      },
    });

    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
