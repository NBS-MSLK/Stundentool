import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const active = await prisma.timeEntry.findFirst({
      where: { userId, endTime: null },
    });

    if (!active) {
      return NextResponse.json({ error: 'No active timer found' }, { status: 400 });
    }

    const now = new Date();
    const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
    const elapsed = now.getTime() - new Date(active.startTime).getTime();

    const finalEndTime = elapsed > SIX_HOURS_MS 
      ? new Date(new Date(active.startTime).getTime() + SIX_HOURS_MS)
      : now;

    const entry = await prisma.timeEntry.update({
      where: { id: active.id },
      data: { endTime: finalEndTime, isConfirmed: false }, // User must review and confirm
    });

    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
